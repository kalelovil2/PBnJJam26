import * as THREE from "three";

export class World {
  scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  add(mesh: THREE.Object3D) {
    this.scene.add(mesh);
  }

  update() {
    // later: traffic, AI, obstacles, etc
  }
}