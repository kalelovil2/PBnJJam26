import * as THREE from "three";

export class ImpactParticle {
  mesh: THREE.Mesh;

  velocity = new THREE.Vector3();

  life = 1.4;

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    size = 0.15
  ) {
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshStandardMaterial({
        color: 0xffaa66,
        emissive: 0xff6600,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 1
      })
    );

    this.mesh.position.copy(position);

    this.velocity.copy(velocity);

    scene.add(this.mesh);
  }

  update(dt: number) {
    this.life -= dt * 2.5;

    this.mesh.position.addScaledVector(
      this.velocity,
      dt
    );

    this.velocity.multiplyScalar(0.96);

    this.mesh.rotation.x += dt * 8;
    this.mesh.rotation.y += dt * 6;

    const mat =
      this.mesh.material as THREE.MeshStandardMaterial;

    mat.opacity = Math.max(0, this.life);

    this.mesh.scale.setScalar(
      Math.max(0.01, this.life)
    );

    return this.life > 0;
  }

  destroy(scene: THREE.Scene) {
    scene.remove(this.mesh);

    this.mesh.geometry.dispose();

    (
      this.mesh.material as THREE.Material
    ).dispose();
  }
}