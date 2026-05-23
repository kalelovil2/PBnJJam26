import * as THREE from "three";

export class CargoHealth {
  maxHp: number;
  hp: number;

  mesh: THREE.Mesh;

  private flashTime = 0;

  constructor(mesh: THREE.Mesh, maxHp = 100) {
    this.mesh = mesh;
    this.maxHp = maxHp;
    this.hp = maxHp;
  }

  applyDamage(amount: number) {
    this.hp = Math.max(0, this.hp - amount);
    this.flashTime = 0.2;

    const mat = this.mesh.material as THREE.MeshStandardMaterial;
    mat.emissive = new THREE.Color(0xff0000);
    mat.emissiveIntensity = 15.0;
  }

  update(dt: number) {
    if (this.flashTime > 0) {
      this.flashTime -= dt;

      const t = this.flashTime / 0.2;

      const mat = this.mesh.material as THREE.MeshStandardMaterial;

      mat.emissiveIntensity = t * 5.0;

      if (this.flashTime <= 0) {
        mat.emissiveIntensity = 0;
      }
    }
  }

  get damageRatio() {
    return 1 - this.hp / this.maxHp;
  }

  get debugString() {
    return `HP: ${this.hp.toFixed(1)} / ${this.maxHp}`;
  }
}