import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import { getWorld } from "../physics";

export class Comet {
    mesh: THREE.Mesh;

    body: RAPIER.RigidBody;
    collider: RAPIER.Collider;

    private trail: THREE.Vector3[] = [];
    private trailLength = 80;
    private trailMesh: THREE.Mesh;
    private trailGeo: THREE.BufferGeometry;
    private trailMat: THREE.MeshBasicMaterial;
    private trailGlowMesh: THREE.Mesh;
    private trailGlowGeo: THREE.BufferGeometry;
    private trailGlowMat: THREE.MeshBasicMaterial;

    alive: boolean = true;

    private lockedY = 0;

    constructor(scene: THREE.Scene) {
        //
        // SMALL ROCKY SHAPE
        //
        const radius =
            0.125 + Math.random() * 0.025

        this.mesh = new THREE.Mesh(
            new THREE.IcosahedronGeometry(radius, 0),
            new THREE.MeshStandardMaterial({
                color: 0xa8b0ba,
                emissive: 0x1a1f2a,
                emissiveIntensity: 0.25,
                roughness: 1.0,
                metalness: 0.05,
                flatShading: true,
                fog: true
            })
        );

        this.trailGeo = new THREE.BufferGeometry();
        this.trailMat = new THREE.MeshBasicMaterial({
            color: 0xbfd8ff,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            fog: false
        });

        this.trailMesh = new THREE.Mesh(this.trailGeo, this.trailMat);
        scene.add(this.trailMesh);

        this.trailGlowGeo = new THREE.BufferGeometry();
        this.trailGlowMat = new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        blending: THREE.AdditiveBlending
        });

        this.trailGlowMesh = new THREE.Mesh(this.trailGlowGeo, this.trailGlowMat);
        scene.add(this.trailGlowMesh);

        scene.add(this.mesh);

        //
        // PHYSICS BODY
        //
        const world = getWorld();

        const bodyDesc =
            RAPIER.RigidBodyDesc.dynamic()
                .setTranslation(0, 0, 0)
                .setLinearDamping(0.0)
                .setAngularDamping(0.2)
                .setCanSleep(false);

        this.body =
            world.createRigidBody(bodyDesc);

        const colliderDesc =
            RAPIER.ColliderDesc.ball(radius)
                .setMass(0.05);

        this.collider =
            world.createCollider(
                colliderDesc,
                this.body
            );

        this.collider.setRestitution(0.05);
        this.collider.setFriction(0.0);
    }

    spawn(center: THREE.Vector3) {
        //
        // SPAWN FAR FROM PLAYER
        //
        const angle =
            Math.random() * Math.PI * 2;

        const tangent = new THREE.Vector3(
            Math.sin(angle),
            0,
            -Math.cos(angle)
        );

        tangent.add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            0,
            (Math.random() - 0.5) * 0.3
        ));

        tangent.normalize();

        const speed = this.rand(4.5, 5.0);

        this.body.setLinvel(
            {
                x: tangent.x * speed,
                y: 0,
                z: tangent.z * speed
            },
            true
        );

        this.lockedY = center.y;

        const spawnPos = new THREE.Vector3(
            center.x + Math.cos(angle) * 120,
            center.y,
            center.z + Math.sin(angle) * 120
        );

        this.body.setTranslation(
            {
                x: spawnPos.x,
                y: spawnPos.y,
                z: spawnPos.z
            },
            true
        );

        //
        // FAST CROSSING DIRECTION
        //
        const dir = new THREE.Vector3(
            -Math.cos(angle),
            0,
            -Math.sin(angle)
        ).normalize();

        dir.multiplyScalar(speed);

        this.body.setLinvel(
            {
                x: dir.x,
                y: dir.y,
                z: dir.z
            },
            true
        );

        //
        // SMALL TUMBLE
        //
        this.body.setAngvel(
            {
                x: this.rand(-1, 1),
                y: this.rand(-1, 1),
                z: this.rand(-1, 1)
            },
            true
        );
    }

    destroy() {
  if (!this.alive) return;

  this.alive = false;

  const world = getWorld();

  world.removeRigidBody(this.body);

  this.mesh.removeFromParent();
  this.trailMesh.removeFromParent();
}

    update() {
        //
        // SYNC VISUALS FROM PHYSICS
        //

        const pos = this.body.translation();

        this.trail.unshift(new THREE.Vector3(pos.x, pos.y, pos.z));

        if (this.trail.length > this.trailLength) {
            this.trail.pop();
        }

        this.body.setTranslation(
            {
                x: pos.x,
                y: this.lockedY,
                z: pos.z
            },
            true
        );
        const rot = this.body.rotation();

        this.mesh.position.set(
            pos.x,
            pos.y,
            pos.z
        );

        this.mesh.quaternion.set(
            rot.x,
            rot.y,
            rot.z,
            rot.w
        );

        console.log("trail size:", this.trail.length);

        this.updateTrailMesh();

        console.log("comet pos:", pos.x, pos.y, pos.z);
    }

private updateTrailMesh() {
  if (this.trail.length < 2) return;

  const core: number[] = [];
  const glow: number[] = [];

  for (let i = 0; i < this.trail.length - 1; i++) {
    const a = this.trail[i];
    const b = this.trail[i + 1];

    const t = i / this.trail.length;

    const coreWidth = (1 - t) * 0.08;
    const glowWidth = (1 - t) * 0.18;

    this.buildStrip(core, a, b, coreWidth);
    this.buildStrip(glow, a, b, glowWidth);
  }

  this.trailGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(core, 3)
  );
  this.trailGeo.computeBoundingSphere();

  this.trailGlowGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(glow, 3)
  );
  this.trailGlowGeo.computeBoundingSphere();
}

    private rand(min: number, max: number) {
        return min + Math.random() * (max - min);
    }

    private buildStrip(
  positions: number[],
  a: THREE.Vector3,
  b: THREE.Vector3,
  width: number
) {
  const dir = new THREE.Vector3()
    .subVectors(b, a)
    .normalize();

  const side = new THREE.Vector3(
    -dir.z,
    0,
    dir.x
  ).multiplyScalar(width);

  positions.push(
    a.x + side.x, a.y, a.z + side.z,
    a.x - side.x, a.y, a.z - side.z,
    b.x + side.x, b.y, b.z + side.z,

    b.x + side.x, b.y, b.z + side.z,
    a.x - side.x, a.y, a.z - side.z,
    b.x - side.x, b.y, b.z - side.z
  );
}
}