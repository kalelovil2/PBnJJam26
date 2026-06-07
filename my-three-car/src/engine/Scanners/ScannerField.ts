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
          60,
          0,
          60
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

checkContrabandDetection(
  shipPos: THREE.Vector3,
  cargoChain: Cargo[]
): boolean {

  if (
    this.detectionCooldown > 0
  ) {
    return false;
  }

  //
  // Not in any beam
  //

  if (
    !this.checkDetection(shipPos)
  ) {
    return false;
  }

  this.detectionCooldown = 5;

  //
  // Beam sees player
  //

  return cargoChain.some(
    cargo =>
      cargo.type ===
      CargoType.CONTRABAND
  );
}

  checkDetection(
  shipPos: THREE.Vector3
): boolean {

  for (const scanner of this.scanners) {
    if (scanner.detects(shipPos)) {
      return true;
    }
  }

  return false;
}
}