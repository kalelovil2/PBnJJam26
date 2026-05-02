import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { getWorld } from "../physics";

export class Cargo {
  mesh: THREE.Mesh;
  body: RAPIER.RigidBody;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1, 1.6),
      new THREE.MeshStandardMaterial({ color: "0x#7F00FF" })
    );

    this.mesh.position.copy(position);

    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y, position.z)
      .setLinearDamping(0.25)
    .setAngularDamping(2.75);

    const world = getWorld();
    this.body = world.createRigidBody(bodyDesc);

    const collider = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 1)
        .setMass(0.2);
    world.createCollider(collider, this.body);
    
    scene.add(this.mesh);
  }

  sync() {
    const pos = this.body.translation();
    const rot = this.body.rotation();

    this.mesh.position.set(pos.x, pos.y, pos.z);
    this.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
  }
}