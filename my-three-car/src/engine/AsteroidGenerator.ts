import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { getWorld } from "../physics";
import { Asteroid } from "./Asteroid";
import { ASTEROID_FIELD_RADIUS, PLAYER_START } from "../main";

export class AsteroidGenerator {
    scene: THREE.Scene;

    asteroidPositions: THREE.Vector3[] = [];

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    createAsteroids(num : number) {
        const asteroids: Asteroid[] = [];

        for (let i = 0; i < num; i++) {
            const radius = 0.6 + Math.random() * 1.25;

            const mesh = this.createAsteroidMesh(
                radius,
                0.08 + Math.random() * 0.15, // roughness
                1 + Math.random() * 3       // detail
            );
           const planeY = sampleAsteroidY();

            const minPlayerDistance = 12;

            var position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
            let valid = false;

            while (!valid) {
                position = new THREE.Vector3(
                    (Math.random() - 0.5) * ASTEROID_FIELD_RADIUS * 2,
                    planeY,
                    (Math.random() - 0.5) * ASTEROID_FIELD_RADIUS * 2
                );

                valid =
                    position.distanceTo(PLAYER_START) >
                    minPlayerDistance;
            }

            mesh.position.set(position.x, position.y, position.z);
            this.scene.add(mesh);

            const startingRotation = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3
            );

            const startingDrift = new THREE.Vector3(
                (Math.random() - 0.5) * 1.25,
                0,
                (Math.random() - 0.5) * 1.25
            );

            const body = this.createAsteroidPhysics(mesh.position, radius, startingRotation, startingDrift);

            this.asteroidPositions.push(mesh.position.clone());
            
            asteroids.push(new Asteroid(mesh, body, planeY));
        }

        return asteroids;
    }

    createAsteroidMesh(
        radius = 1,
        roughness = 0.5,
        detail = 3
    ) {
        const geometry = new THREE.IcosahedronGeometry(radius, 20);

        const pos = geometry.attributes.position;

        const vertex = new THREE.Vector3();

        // random axis stretching
        const stretch = new THREE.Vector3(
            0.7 + Math.random() * 0.8,
            0.7 + Math.random() * 0.8,
            0.7 + Math.random() * 0.8
        );

        for (let i = 0; i < pos.count; i++) {
            vertex.fromBufferAttribute(pos, i);

            // normalized direction
            const normal = vertex.clone().normalize();

            // smooth pseudo-noise
            const noise =
                Math.sin(normal.x * detail) *
                Math.sin(normal.y * detail) *
                Math.sin(normal.z * detail);

            // displacement
            const displacement = 1 + noise * roughness;

            vertex.copy(normal.multiplyScalar(radius * displacement));

            // re-apply stretch after displacement
            vertex.x *= stretch.x;
            vertex.y *= stretch.y;
            vertex.z *= stretch.z;

            pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }

        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({
            map: this.createAsteroidTexture(),
            bumpMap: this.createAsteroidBumpMap(),
            bumpScale: 1.25,
            flatShading: true,
            roughness: 1
        });

        return new THREE.Mesh(geometry, material);
    }

    createAsteroidTexture() {
        const size = 512;

        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d")!;

        ctx.fillStyle = "#444";
        ctx.fillRect(0, 0, size, size);

        // fine rocky grain
        for (let i = 0; i < 30000; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;

            const brightness = 90 + Math.random() * 40;

            ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;

            ctx.fillRect(x, y, 1, 1);
        }

        // broad soft surface variation
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;

            const radius = 30 + Math.random() * 80;

            const shade = 80 + Math.random() * 60;

            const gradient = ctx.createRadialGradient(
                x,
                y,
                0,
                x,
                y,
                radius
            );

            gradient.addColorStop(
                0,
                `rgba(${shade}, ${shade}, ${shade}, 0.2)`
            );

            gradient.addColorStop(
                1,
                `rgba(${shade}, ${shade}, ${shade}, 0)`
            );

            ctx.fillStyle = gradient;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // occasional subtle craters
        for (let i = 0; i < 120; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;

            const radius = 4 + Math.random() * 18;

            const gradient = ctx.createRadialGradient(
                x,
                y,
                radius * 0.2,
                x,
                y,
                radius
            );

            gradient.addColorStop(0, "rgba(90,90,90,0.4)");
            gradient.addColorStop(0.7, "rgba(140,140,140,0.15)");
            gradient.addColorStop(1, "rgba(128,128,128,0)");

            ctx.fillStyle = gradient;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        return new THREE.CanvasTexture(canvas);
    }

    createAsteroidBumpMap() {
        const size = 512;

        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d")!;

        // darker baseline (important: removes flatness)
        ctx.fillStyle = "rgb(150,150,150)";
        ctx.fillRect(0, 0, size, size);

        function drawCrater(intensity = 1) {
            const x = Math.random() * size;
            const y = Math.random() * size;

            const radius = 6 + Math.random() * 22;

            const inner = radius * 0.15;
            const mid = radius * 0.5;

            const g = ctx.createRadialGradient(x, y, inner, x, y, radius);

            // key change: much deeper center + stronger rim
            const center = 40 - Math.random() * 25; // darker = deeper
            const rim = 170 + Math.random() * 30;

            g.addColorStop(0, `rgb(${center},${center},${center})`);
            g.addColorStop(0.4, `rgb(90,90,90)`);
            g.addColorStop(0.75, `rgb(${rim},${rim},${rim})`);
            g.addColorStop(1, "rgb(150,150,150)");

            ctx.fillStyle = g;

            ctx.beginPath();
            ctx.arc(x, y, radius * intensity, 0, Math.PI * 2);
            ctx.fill();

            // SECOND PASS: inner “dent punch”
            ctx.globalAlpha = 0.35;

            const g2 = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.4);

            g2.addColorStop(0, "rgb(20,20,20)");
            g2.addColorStop(1, "rgba(0,0,0,0)");

            ctx.fillStyle = g2;
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1;
        }

        // fewer craters, but stronger ones
        for (let i = 0; i < 180; i++) {
            drawCrater(1.2);
        }

        // occasional mega impact craters
        for (let i = 0; i < 25; i++) {
            drawCrater(2.0);
        }

        return new THREE.CanvasTexture(canvas);
    }

    createAsteroidPhysics(position: { x: any; y: any; z: any; }, radius = 1,
        startingRotation = new THREE.Vector3, startingDrift = new THREE.Vector3
    ) {
        const world = getWorld();

        const q = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            )
        );

        // rigid body
        const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(position.x, position.y, position.z)
            .setRotation(q)
            .setLinearDamping(0)
            .setAngularDamping(0)
            .setCanSleep(false);

        const body = world.createRigidBody(bodyDesc);
        body.setLinvel(
            { x: startingDrift.x, y: startingDrift.y, z: startingDrift.z },
            false
        );
        body.setAngvel(
            { x: startingRotation.x, y: startingRotation.y, z: startingRotation.z },
            false
        );

        body.wakeUp();

        // collider (sphere is best for asteroids)
        const colliderDesc = RAPIER.ColliderDesc
            .ball(radius)
            .setMass(5 * radius);

        world.createCollider(colliderDesc, body);

        return body;
    }
}

function sampleAsteroidY() {
    const bands = [-8, 0, 8];

    // middle lane more common
    const weights = [1, 5, 1];

    const totalWeight = weights.reduce((a, b) => a + b, 0);

    let r = Math.random() * totalWeight;

    for (let i = 0; i < bands.length; i++) {
        r -= weights[i];

        if (r <= 0) {
            return bands[i];
        }
    }

    // fallback (should never happen)
    return 0;
}

