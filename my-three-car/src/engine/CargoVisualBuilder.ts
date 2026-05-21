import * as THREE from "three";
import { CargoType } from "./Cargo";

export interface CargoVisual extends THREE.Group {
  hull: THREE.Mesh;
  frontAnchor: THREE.Object3D;
  rearAnchor: THREE.Object3D;
}

export class CargoVisualBuilder {
  static create(type: CargoType): CargoVisual {
    const root = new THREE.Group() as CargoVisual;

    const palette = this.getPalette(type);

    //
    // MAIN HULL (this is what gets damaged)
    //
    const hullGeo = new THREE.BoxGeometry(
      0.9,
      1,
      1.6,
      6,
      6,
      10
    );

    const hullMat = new THREE.MeshStandardMaterial({
      color: palette.body,
      roughness: 0.85,
      metalness: 0.35,
      flatShading: true
    });

    const hull = new THREE.Mesh(hullGeo, hullMat);
    root.add(hull);
    root.hull = hull;

    //
    // INNER FRAME (visual depth layer)
    //
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 1.05, 1.65),
      new THREE.MeshStandardMaterial({
        color: palette.frame,
        roughness: 0.9,
        metalness: 0.2,
        transparent: true,
        opacity: 0.2
      })
    );

    root.add(frame);

    //
    // CORNER RAILS
    //
    const railGeo = new THREE.BoxGeometry(0.06, 0.06, 1.7);

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
    ] as const;

    for (const [x, y, z] of offsets) {
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(x, y, z);
      root.add(rail);
    }

    //
    // FRONT ANCHOR (tether attaches here)
    //
    const frontAnchor = new THREE.Object3D();
    frontAnchor.position.set(0, 0, -0.85); // front face of cargo
    root.add(frontAnchor);
    root.frontAnchor = frontAnchor;

    //
    // REAR ANCHOR (tether attaches here)
    //
    const rearAnchor = new THREE.Object3D();
    rearAnchor.position.set(0, 0, 0.85); // back face of cargo
    root.add(rearAnchor);
    root.rearAnchor = rearAnchor;

    //
    // EMISSIVE STRIP (identity marker)
    //
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.06, 0.02),
      new THREE.MeshStandardMaterial({
        color: 0x111111,
        emissive: palette.emissive,
        emissiveIntensity: 1.5
      })
    );

    strip.position.set(0, 0.35, 0.81);
    root.add(strip);

    //
    // SMALL LIGHTS
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
    // slight variation
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