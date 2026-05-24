import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import { Checkpoint } from "./Checkpoint";
import { ASTEROID_SAFE_RADIUS, CHECKPOINT_CLEARANCE, CHECKPOINT_COUNT, LEVEL_SIZE, PLAYER_START } from "../../GameConfig";

export class CheckpointGenerator {
  static async spawnCheckpoints(
    scene: THREE.Scene,
    world: RAPIER.World,
    asteroids:  { position: THREE.Vector3 }[]
  ): Promise<Checkpoint[]> {
    const checkpoints: Checkpoint[] = [];

    // checkpoints should not cluster together
    const minCheckpointDistance = LEVEL_SIZE * 0.25;

    // avoid edge-of-map spawns
    const usableRadius = LEVEL_SIZE * 0.75;

    for (let i = 0; i < CHECKPOINT_COUNT; i++) {
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
          position.distanceTo(PLAYER_START) <
          ASTEROID_SAFE_RADIUS
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
              asteroid.position.distanceTo(position) <
              CHECKPOINT_CLEARANCE
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