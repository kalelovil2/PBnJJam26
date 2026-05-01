import * as THREE from "three";

export class Car {
  mesh: THREE.Mesh;
  speed = 0.1;

  velocityX = 0;
  velocityZ = 0;

  keys: Record<string, boolean> = {};

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.5, 2),
      new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    );

    scene.add(this.mesh);

    window.addEventListener("keydown", (e) => (this.keys[e.key] = true));
    window.addEventListener("keyup", (e) => (this.keys[e.key] = false));
  }

  update() {
    const accel = 0.01;
    const friction = 0.95;

    if (this.keys["w"]) this.velocityZ -= accel;
    if (this.keys["s"]) this.velocityZ += accel;
    if (this.keys["a"]) this.velocityX -= accel;
    if (this.keys["d"]) this.velocityX += accel;

    this.velocityX *= friction;
    this.velocityZ *= friction;

    this.mesh.position.x += this.velocityX;
    this.mesh.position.z += this.velocityZ;
  }
}