import * as THREE from "three";

import { ImpactParticle } from "./ImpactParticle";

export class ImpactParticleSystem {
  scene: THREE.Scene;

  particles: ImpactParticle[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawnImpact(
    position: THREE.Vector3,
    normal: THREE.Vector3,
    strength: number
  ) {

    //console.log("Impact Particles");

    const count =
      Math.min(
        100,
        Math.max(80, Math.floor(strength * 4))
      );

    for (let i = 0; i < count; i++) {

      const dir =
        normal.clone()
          .add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 1.2,
              (Math.random() - 0.5) * 1.2,
              (Math.random() - 0.5) * 1.2
            )
          )
          .normalize();

      const speed =
        1.5 + Math.random() * strength * 0.12;

      const velocity =
        dir.multiplyScalar(speed);

      const particle =
        new ImpactParticle(
          this.scene,
          position,
          velocity
        );

      this.particles.push(particle);
    }
  }

  update(dt: number) {
    this.particles =
      this.particles.filter((p) => {

        const alive = p.update(dt);

        if (!alive) {
          p.destroy(this.scene);
        }

        return alive;
      });
  }
}