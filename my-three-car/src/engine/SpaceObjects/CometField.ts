import * as THREE from "three";
import { Comet } from "./Comet";

export class CometField {
  private comets: Comet[] = [];
  
  constructor(
    scene: THREE.Scene,
    count = 8
  ) {
    for (let i = 0; i < count; i++) {
      const comet = new Comet(scene);

      comet.spawn(new THREE.Vector3());

      this.comets.push(comet);
    }
  }

  update(playerPos: THREE.Vector3) {
  for (const comet of this.comets) {
    comet.update();

    const pos =
      comet.body.translation();

    const dx = pos.x - playerPos.x;
    const dy = pos.y - playerPos.y;
    const dz = pos.z - playerPos.z;

    const distSq =
      dx * dx +
      dy * dy +
      dz * dz;

    //
    // RECYCLE DISTANT COMETS
    //
    if (distSq > 220 * 220) {
      comet.spawn(playerPos);
    }
  }
}
}