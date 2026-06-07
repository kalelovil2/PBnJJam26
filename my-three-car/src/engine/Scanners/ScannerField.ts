import * as THREE from "three";
import { Scanner } from "./Scanner";
import { CargoType, type Cargo } from "../Cargo/Cargo";

export class ScannerField {
  scanners: Scanner[] = [];

  private detectionCooldown = 0;

  constructor(
    scene: THREE.Scene
  ) {
    //
    // Hand-placed initially
    //

    this.scanners.push(
      new Scanner(
        scene,
        new THREE.Vector3(
          0,
          0,
          -20
        )
      )
    );

    this.scanners.push(
      new Scanner(
        scene,
        new THREE.Vector3(
          -80,
          0,
          20
        )
      )
    );

    this.scanners.push(
      new Scanner(
        scene,
        new THREE.Vector3(
          20,
          0,
          -90
        )
      )
    );
  }

  update(dt: number) {
    this.detectionCooldown =
      Math.max(
        0,
        this.detectionCooldown - dt
      );

    for (const scanner of this.scanners) {
      scanner.update(dt);
    }
  }

  checkDetection(
    position: THREE.Vector3
  ): Scanner | null {

    for (const scanner of this.scanners) {

      if (
        scanner.detects(position)
      ) {
        return scanner;
      }
    }

    return null;
  }

  checkContrabandDetection(
    cargoChain: Cargo[]
  ): Scanner | null {

    //
    // Prevent spam
    //

    if (this.detectionCooldown > 0) {
      return null;
    }

    //
    // Only contraband cargo matters
    //

    for (const cargo of cargoChain) {

      if (
        cargo.type !==
        CargoType.CONTRABAND
      ) {
        continue;
      }

      const scanner =
        this.checkDetection(
          cargo.mesh.position
        );

      if (scanner) {

        this.detectionCooldown = 5;

        return scanner;
      }
    }

    return null;
  }
}