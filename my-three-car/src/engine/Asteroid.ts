import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

export class Asteroid {
  mesh: THREE.Mesh;
  body: RAPIER.RigidBody;

  constructor(mesh: THREE.Mesh, body: RAPIER.RigidBody) {
    this.mesh = mesh;
    this.body = body;
  }

  syncFromPhysics() {
    const pos = this.body.translation();
    const rot = this.body.rotation();

    this.mesh.position.set(pos.x, pos.y, pos.z);
    this.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
  }
}