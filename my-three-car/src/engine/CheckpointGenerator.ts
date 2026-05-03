import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";

import { Checkpoint } from "./Checkpoint";
import { Asteroid } from "./Asteroid";

export class CheckpointGenerator {
  static async spawnCheckpoints(
    scene: THREE.Scene,
    world: RAPIER.World,
    asteroids: Asteroid[],
    count: number,
    levelRadius: number
  ): Promise<Checkpoint[]> {
    const checkpoints: Checkpoint[] = [];

    // checkpoints should not cluster together
    const minCheckpointDistance = levelRadius * 0.25;

    // keep checkpoints away from asteroids
    const asteroidClearance = 10;

    // safe space around player spawn
    const playerStart = new THREE.Vector3(0, 0, -4);
    const playerSafeRadius = 15;

    // avoid edge-of-map spawns
    const usableRadius = levelRadius * 0.75;

    for (let i = 0; i < count; i++) {
      let position = new THREE.Vector3();
      let valid = false;

      let attempts = 0;
      const maxAttempts = 1000;

      while (!valid && attempts < maxAttempts) {
        attempts++;

        position.set(
          THREE.MathUtils.randFloatSpread(usableRadius * 2),
          0,
          THREE.MathUtils.randFloatSpread(usableRadius * 2)
        );

        valid = true;

        // avoid player spawn
        if (
          position.distanceTo(playerStart) <
          playerSafeRadius
        ) {
          valid = false;
        }

        // avoid other checkpoints
        if (valid) {
          for (const checkpoint of checkpoints) {
            if (
              checkpoint.mesh.position.distanceTo(position) <
              minCheckpointDistance
            ) {
              valid = false;
              break;
            }
          }
        }

        // avoid asteroids
        if (valid) {
          for (const asteroid of asteroids) {
            if (
              asteroid.mesh.position.distanceTo(position) <
              asteroidClearance
            ) {
              valid = false;
              break;
            }
          }
        }
      }

      if (!valid) {
        console.warn(
          "Failed to find valid checkpoint position"
        );
        continue;
      }

      const checkpoint = new Checkpoint(world, position);

      scene.add(checkpoint.mesh);

      checkpoint.syncFromPhysics();

      checkpoints.push(checkpoint);
    }

    return checkpoints;
  }
}