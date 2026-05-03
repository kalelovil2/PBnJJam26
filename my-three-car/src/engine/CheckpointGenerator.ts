import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";

import { Checkpoint } from "./Checkpoint";

export class CheckpointGenerator {
  static async spawnCheckpoints(
    scene: THREE.Scene,
    world: RAPIER.World,
    count: number,
    levelRadius: number
  ): Promise<Checkpoint[]> {
    const checkpoints: Checkpoint[] = [];

    const minDistance = levelRadius * 0.25;

    for (let i = 0; i < count; i++) {
      let position: THREE.Vector3;
      let valid = false;

      // keep trying until spaced far enough away
      while (!valid) {
        position = new THREE.Vector3(
          THREE.MathUtils.randFloatSpread(levelRadius * 2),
          0,
          THREE.MathUtils.randFloatSpread(levelRadius * 2)
        );
            //THREE.log("Position -1: ", position)

        valid = true;

        for (const checkpoint of checkpoints) {
          if (
            checkpoint.mesh.position.distanceTo(position) <
            minDistance
          ) {
            valid = false;
            break;
          }
        }
      }
            //THREE.log("Position 0: ", position!)

      const checkpoint = new Checkpoint(world, position!);
      scene.add(checkpoint.mesh);

      checkpoint.syncFromPhysics();

      checkpoints.push(checkpoint);
    }

    return checkpoints;
  }
}