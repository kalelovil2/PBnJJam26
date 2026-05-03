import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export class Checkpoint {
  mesh: THREE.Mesh;
  body: RAPIER.RigidBody;

  constructor(world: RAPIER.World, position: THREE.Vector3) {
    // VISUAL BASE
    this.mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 0.05, 48),
      new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x0088ff,
      })
    );
    this.mesh.geometry.translate(0, -0.25, 0);

    this.mesh.position.set(0, -0.1, 0);

    // PHYSICS BODY
    const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
      position.x,
      position.y,
      position.z
    );

    this.body = world.createRigidBody(bodyDesc);

    // SOLID PHYSICS COLLIDER (NON-SENSOR)
    const ringCollider = RAPIER.ColliderDesc.cuboid(0.95, 0.3, 0.95)
      .setTranslation(0, 0.2, 0);

    world.createCollider(ringCollider, this.body);

    // SENSOR COLLIDER
    const sensorCollider = RAPIER.ColliderDesc.cuboid(2, 2, 2)
      .setSensor(true);

    world.createCollider(sensorCollider, this.body);

    // LOAD VISUAL MODEL
    loadModel(this.mesh);
  }

  syncFromPhysics() {
    const pos = this.body.translation();
    const rot = this.body.rotation();

    this.mesh.position.set(pos.x, pos.y, pos.z);
    this.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
  }
}

async function loadModel(mesh: THREE.Mesh) 
{
  const loader = new GLTFLoader();

    await loader.loadAsync("./checkpoint_v01.glb").then((glb) => {
      const model = glb.scene;
      model.scale.set(0.075, 0.075, 0.075);       // Adjust model scale
      model.position.set(0, 0, 0);    // Adjust model position
      model.rotation.set(0, 0, 0);
      model.rotation.y = Math.PI;
      mesh.add(model);
    });
}