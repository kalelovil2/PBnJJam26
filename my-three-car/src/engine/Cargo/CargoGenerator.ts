import * as THREE from "three";

import { Cargo, CargoType } from "./Cargo";
import { Checkpoint } from "../Checkpoints/Checkpoint";
import { ASTEROID_CLEARANCE, CARGO_CLEARANCE, CARGO_COUNT, CHECKPOINT_CLEARANCE, LEVEL_SIZE, PLAYER_CLEARANCE, PLAYER_START } from "../../GameConfig";

export class CargoGenerator {
  static spawnCargo(
    scene: THREE.Scene,
    asteroids: { position: THREE.Vector3 }[],
    checkpoints: Checkpoint[],
  ): Cargo[] {
    const cargoList: Cargo[] = [];

    const usableRadius = LEVEL_SIZE * 0.75;

    for (let i = 0; i < CARGO_COUNT; i++) {
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
          position.distanceTo(PLAYER_START) <
          PLAYER_CLEARANCE
        ) {
          valid = false;
        }

        // avoid asteroids
        if (valid) {
          for (const asteroid of asteroids) {
            if (
              asteroid.position.distanceTo(
                position
              ) < ASTEROID_CLEARANCE
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
              ) < CHECKPOINT_CLEARANCE
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
              ) < CARGO_CLEARANCE
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