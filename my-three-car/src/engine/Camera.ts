import * as THREE from "three";

export class GameCamera {
  camera: THREE.PerspectiveCamera;
  offset = new THREE.Vector3(0, 10, 10);

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  update(targetPos: THREE.Vector3) {
    const desired = new THREE.Vector3().addVectors(
      targetPos,
      this.offset
    );

    // smooth follow (lerp)
    this.camera.position.lerp(desired, 0.1);

    this.camera.lookAt(targetPos);
  }
}