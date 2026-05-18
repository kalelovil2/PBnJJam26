import * as THREE from "three";

export class CargoDamageVisual {
  mesh: THREE.Mesh;

  private material: THREE.MeshStandardMaterial;

  private damage = 0;

  constructor(baseMesh: THREE.Mesh) {
    this.material = baseMesh.material as THREE.MeshStandardMaterial;

    this.mesh = baseMesh;
  }

  applyDamage(amount: number) {
const geometry = this.mesh.geometry as THREE.BoxGeometry;
const pos = geometry.attributes.position;

    this.damage = Math.min(1, this.damage + amount);

    // darken + roughen
    this.material.emissive = new THREE.Color(0xff2200);
    this.material.emissiveIntensity = this.damage * 1.5;

    this.material.roughness = 1 - this.damage * 0.4;

    // slight scale "dent illusion"
    const s = 1 - this.damage * 0.05;
    this.mesh.scale.set(s, s, s);

    for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  const y = pos.getY(i);
  const z = pos.getZ(i);

  const d = Math.random() * 0.05 * amount;

  pos.setXYZ(i, x - x * d, y - y * d, z - z * d);
}

pos.needsUpdate = true;
geometry.computeVertexNormals();
  }

  resetFlash() {
    this.material.emissiveIntensity *= 0.8;
  }
}