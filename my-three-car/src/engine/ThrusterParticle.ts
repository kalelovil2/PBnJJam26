import * as THREE from "three";

export class ThrusterParticle {
  mesh: THREE.Mesh;
  life: number;
  startOpacity: number;

  constructor(position: THREE.Vector3, size: number, startOpacity: number = 0.4) {
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(size, 6, 6),
      new THREE.MeshBasicMaterial({
        color: 0xffaa55,
        blending: THREE.NormalBlending,
        transparent: true,
        opacity: startOpacity,
        depthWrite: false
      })
    );

    this.mesh.position.copy(position);

    this.life = 1.0;
    this.startOpacity = startOpacity;
  }

  update() {
    this.life -= 0.02;

    const mat = this.mesh.material as THREE.MeshBasicMaterial;

    // fade from startOpacity → 0
    mat.opacity = this.life * this.startOpacity;

    return this.life > 0;
  }
}