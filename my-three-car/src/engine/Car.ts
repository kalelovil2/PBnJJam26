import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { getWorld } from "../physics";

export class Car {
  static FORWARD_Z = -1;

  mesh: THREE.Mesh;
  body: RAPIER.RigidBody;

  keys: Record<string, boolean> = {};

  constructor(scene: THREE.Scene) {
    // -------------------------
    // Visual mesh
    // -------------------------
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.5, 2),
      new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    );

    scene.add(this.mesh);

    // -------------------------
    // Physics body
    // -------------------------
    const world = getWorld();

    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(0, 2, 0)
      .setLinearDamping(0.6)   // prevents endless sliding
      .setAngularDamping(2.0)  // stabilises rotation
      .setCanSleep(false)
      .enabledRotations(false, true, false);

    this.body = world.createRigidBody(bodyDesc);

    const collider = RAPIER.ColliderDesc.cuboid(0.5, 0.25, 1);
    world.createCollider(collider, this.body);

    // -------------------------
    // Input
    // -------------------------
    window.addEventListener("keydown", (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  update() {
    const thrust = 0.04;
    const turnTorque = 0.01;

    // current orientation
    const rot = this.body.rotation();
    const quat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);

    const forward = new THREE.Vector3(0, 0, Car.FORWARD_Z).applyQuaternion(quat);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);

    // -------------------------
    // THRUST (W/S)
    // -------------------------
    if (this.keys["w"]) {
      this.body.applyImpulse(
        { x: forward.x * thrust, y: 0, z: forward.z * thrust },
        false
      );
    }

    if (this.keys["s"]) {
      this.body.applyImpulse(
        { x: -forward.x * thrust, y: 0, z: -forward.z * thrust },
        false
      );
    }

    // -------------------------
    // STRAFE (Q/E)
    // -------------------------
    if (this.keys["q"]) {
      this.body.applyImpulse(
        { x: -right.x * thrust, y: 0, z: -right.z * thrust },
        false
      );
    }

    if (this.keys["e"]) {
      this.body.applyImpulse(
        { x: right.x * thrust, y: 0, z: right.z * thrust },
        false
      );
    }

    // -------------------------
    // TURNING (A/D)
    // -------------------------
    if (this.keys["a"]) {
      this.body.applyTorqueImpulse({ x: 0, y: turnTorque, z: 0 }, false);
    }

    if (this.keys["d"]) {
      this.body.applyTorqueImpulse({ x: 0, y: -turnTorque, z: 0 }, false);
    }

    // -------------------------
    // SYNC VISUAL → PHYSICS
    // -------------------------
    const pos = this.body.translation();
    const r = this.body.rotation();

    this.mesh.position.set(pos.x, pos.y, pos.z);
    this.mesh.quaternion.set(r.x, r.y, r.z, r.w);
  }
}