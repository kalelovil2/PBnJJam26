import * as THREE from "three";
import { ThrusterPickup } from "./ThrusterPickup";
import { LEVEL_SIZE } from "../../GameConfig";

export class ThrusterField {

  thrusters: ThrusterPickup[] = [];

  constructor(
    scene: THREE.Scene,
    count: number
  ) {

    for (let i = 0; i < count; i++) {

      const angle =
        Math.random() * Math.PI * 2;

      const dist =
        Math.sqrt(Math.random()) *
        LEVEL_SIZE;

      const position =
        new THREE.Vector3(
          Math.cos(angle) * dist,
          0,
          Math.sin(angle) * dist
        );

      const thruster =
        new ThrusterPickup(
          scene,
          position
        );

      this.thrusters.push(
        thruster
      );
    }
  }

  update(dt: number) {

    for (const thruster of this.thrusters) {
      thruster.update(dt);
    }
  }
}