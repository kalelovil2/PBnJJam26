import * as THREE from "three";
import { CargoType } from "./Cargo";

export class CargoVisualBuilder {
  static create(type: CargoType): THREE.Group {
    const root = new THREE.Group();

    const palette = this.getPalette(type);

    //
    // MAIN HULL
    //
    const hullGeo = new THREE.BoxGeometry(
      0.9,
      1,
      1.6,
      4,
      4,
      8
    );

    const hullMat = new THREE.MeshStandardMaterial({
      color: palette.body,
      roughness: 0.85,
      metalness: 0.35,
      flatShading: true
    });

    const hull = new THREE.Mesh(hullGeo, hullMat);
    root.add(hull);

    //
    // INNER FRAME (slightly inset "panel shell")
    //
    const frameGeo = new THREE.BoxGeometry(
      0.95,
      1.05,
      1.65
    );

    const frameMat = new THREE.MeshStandardMaterial({
      color: palette.frame,
      roughness: 0.9,
      metalness: 0.2,
      wireframe: false,
      transparent: true,
      opacity: 0.25
    });

    const frame = new THREE.Mesh(frameGeo, frameMat);
    root.add(frame);

    //
    // CORNER RAILS (very important for silhouette)
    //
    const railGeo = new THREE.BoxGeometry(
      0.06,
      0.06,
      1.7
    );

    const railMat = new THREE.MeshStandardMaterial({
      color: palette.rail,
      roughness: 0.6,
      metalness: 0.7
    });

    const offsets = [
      [ 0.46, 0.46, 0],
      [-0.46, 0.46, 0],
      [ 0.46,-0.46, 0],
      [-0.46,-0.46, 0],
    ];

    for (const [x, y, z] of offsets) {
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(x, y, z);
      root.add(rail);
    }

    //
    // EMISSIVE STRIP (identity marker)
    //
    const stripGeo = new THREE.BoxGeometry(
      0.92,
      0.06,
      0.02
    );

    const stripMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      emissive: palette.emissive,
      emissiveIntensity: 1.5
    });

    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(0, 0.35, 0.81);
    root.add(strip);

    //
    // SIDE MARKER LIGHTS (small readable accents)
    //
    const lightGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);

    const lightMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: palette.emissive,
      emissiveIntensity: 2.0
    });

    const l1 = new THREE.Mesh(lightGeo, lightMat);
    l1.position.set(0.45, 0.2, 0.6);

    const l2 = new THREE.Mesh(lightGeo, lightMat);
    l2.position.set(-0.45, -0.2, -0.6);

    root.add(l1, l2);

    //
    // subtle tilt variation (breaks uniformity)
    //
    root.rotation.y = Math.random() * 0.2 - 0.1;

    return root;
  }

  private static getPalette(type: CargoType) {
    switch (type) {
      case CargoType.CONTRABAND:
        return {
          body: 0x2b2b2f,
          frame: 0x3a3a40,
          rail: 0x1a1a1f,
          emissive: 0xff3b2f
        };

      case CargoType.SAFE:
      default:
        return {
          body: 0x2f3b3f,
          frame: 0x3a4a50,
          rail: 0x1d2528,
          emissive: 0x36d6ff
        };
    }
  }
}