import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

export class Asteroid {
  mesh: THREE.Mesh;
  body: RAPIER.RigidBody;

  planeY: number;

  constructor(
    mesh: THREE.Mesh,
    body: RAPIER.RigidBody,
    planeY: number
  ) {
    this.mesh = mesh;
    this.body = body;
    this.planeY = planeY;
  }

  update() {
    // keep asteroid locked to its original plane
    const pos = this.body.translation();

    this.body.setTranslation(
      {
        x: pos.x,
        y: this.planeY,
        z: pos.z
      },
      false
    );

    // remove vertical drift velocity
    const vel = this.body.linvel();

    this.body.setLinvel(
      {
        x: vel.x,
        y: 0,
        z: vel.z
      },
      false
    );

    // sync mesh from physics
    const rot = this.body.rotation();

    this.mesh.position.set(pos.x, this.planeY, pos.z);
    this.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
  }
}