import * as THREE from "three";

import { Comet } from "./Comet";

export class CometField {
  comets: Comet[] = [];

  private scene: THREE.Scene;
  private targetCount: number;

  constructor(
    scene: THREE.Scene,
    count: number
  ) {
    this.scene = scene;
    this.targetCount = count;

    for (let i = 0; i < count; i++) {
      const comet = new Comet(scene);

      this.comets.push(comet);

      comet.spawn(
        new THREE.Vector3(
          (Math.random() - 0.5) * 200,
          0,
          (Math.random() - 0.5) * 200
        ),
        this.randomDirection()
      );
    }
  }

  update(playerPos: THREE.Vector3) {
    for (let i = this.comets.length - 1; i >= 0; i--) {
      const comet = this.comets[i];

      comet.update();

      //
      // REMOVE DESTROYED
      //
      if (!comet.alive) {
        comet.destroy();

        this.comets.splice(i, 1);

        continue;
      }

      //
      // DESPAWN FAR AWAY
      //
      const dist =
        comet.mesh.position.distanceTo(playerPos);

      if (dist > 250) {
        comet.destroy();

        this.comets.splice(i, 1);
      }
    }

    //
    // REFILL FIELD
    //
    while (this.comets.length < this.targetCount) {
      const comet = new Comet(this.scene);

      const angle =
        Math.random() * Math.PI * 2;

      const radius =
        120 + Math.random() * 80;

      const spawnPos = new THREE.Vector3(
        playerPos.x + Math.cos(angle) * radius,
        playerPos.y,
        playerPos.z + Math.sin(angle) * radius
      );

      comet.spawn(
        spawnPos,
        this.randomDirection()
      );

      this.comets.push(comet);
    }
  }

  //
  // RANDOM HORIZONTAL TRAVEL DIRECTION
  //
  private randomDirection(): THREE.Vector3 {
    const angle =
      Math.random() * Math.PI * 2;

    return new THREE.Vector3(
      Math.cos(angle),
      0,
      Math.sin(angle)
    ).normalize();
  }
}