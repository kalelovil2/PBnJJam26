import * as THREE from "three";

import { Cargo, CargoType } from "./Cargo";
import { Asteroid } from "./Asteroid";
import { Checkpoint } from "./Checkpoint";

export class CargoGenerator {
  static spawnCargo(
    scene: THREE.Scene,
    asteroids: Asteroid[],
    checkpoints: Checkpoint[],
    count: number,
    levelRadius: number
  ): Cargo[] {
    const cargoList: Cargo[] = [];

    const playerStart = new THREE.Vector3(0, 0, -4);

    const playerClearance = 15;
    const asteroidClearance = 8;
    const checkpointClearance = 10;
    const cargoClearance = 6;

    const usableRadius = levelRadius * 0.75;

    for (let i = 0; i < count; i++) {
      let valid = false;

      let position = new THREE.Vector3();

      let attempts = 0;

      while (!valid && attempts < 1000) {
        attempts++;

        position.set(
          THREE.MathUtils.randFloatSpread(
            usableRadius * 2
          ),
          0,
          THREE.MathUtils.randFloatSpread(
            usableRadius * 2
          )
        );

        
        
        const startingDrift = new THREE.Vector3(
            (Math.random() - 0.5) * 1.25,
            0,
            (Math.random() - 0.5) * 1.25
        );

        valid = true;

        // avoid player
        if (
          position.distanceTo(playerStart) <
          playerClearance
        ) {
          valid = false;
        }

        // avoid asteroids
        if (valid) {
          for (const asteroid of asteroids) {
            if (
              asteroid.mesh.position.distanceTo(
                position
              ) < asteroidClearance
            ) {
              valid = false;
              break;
            }
          }
        }

        // avoid checkpoints
        if (valid) {
          for (const checkpoint of checkpoints) {
            if (
              checkpoint.mesh.position.distanceTo(
                position
              ) < checkpointClearance
            ) {
              valid = false;
              break;
            }
          }
        }

        // avoid other cargo
        if (valid) {
          for (const cargo of cargoList) {
            if (
              cargo.mesh.position.distanceTo(
                position
              ) < cargoClearance
            ) {
              valid = false;
              break;
            }
          }
        }
      }

      if (!valid) {
        console.warn(
          "Failed to place cargo"
        );
        continue;
      }

      const type =
        Math.random() < 0.3
          ? CargoType.CONTRABAND
          : CargoType.SAFE;

      const cargo = new Cargo(
        scene,
        position.clone(),
        type
      );

      cargoList.push(cargo);
    }

    return cargoList;
  }
}