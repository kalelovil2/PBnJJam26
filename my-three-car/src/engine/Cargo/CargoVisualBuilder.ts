import * as THREE from "three";
import { CargoType } from "./Cargo";

export interface CargoVisual extends THREE.Group {
  hull: THREE.Mesh;
  frontAnchor: THREE.Object3D;
  rearAnchor: THREE.Object3D;
}

export class CargoVisualBuilder {
  private static rand(min: number, max: number) {
    return min + Math.random() * (max - min);
  }

  private static safeZ(z: number) {
    // prevents detail sticking out of front/back faces
    if (Math.abs(z) > 0.55) return Math.sign(z) * 0.55;
    return z;
  }

  static create(type: CargoType): CargoVisual {
    const root = new THREE.Group() as CargoVisual;

    const palette = this.getPalette(type);

    //
    // =========================
    // HULL (PRIMARY FORM)
    // =========================
    //
    const hullGeo = new THREE.BoxGeometry(0.9, 1, 1.6, 4, 4, 6);

    const hullMat = new THREE.MeshStandardMaterial({
      color: palette.body,
      roughness: 0.9,
      metalness: 0.25,
      flatShading: true
    });

    // readability lift in dark space
    hullMat.color.offsetHSL(0, 0, 0.08);

    const hull = new THREE.Mesh(hullGeo, hullMat);
    root.add(hull);
    root.hull = hull;

    //
    // CONTRABAND: slight organic instability
    //
    if (type === CargoType.CONTRABAND) {
      hull.scale.set(
        1 + (Math.random() - 0.5) * 0.08,
        1 + (Math.random() - 0.5) * 0.12,
        1 + (Math.random() - 0.5) * 0.08
      );
    }

    //
    // =========================
    // FRAME (DEPTH LAYER)
    // =========================
    //
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 1.05, 1.65),
      new THREE.MeshStandardMaterial({
        color: palette.frame,
        roughness: 0.95,
        metalness: 0.15,
        transparent: true,
        opacity: 0.2
      })
    );

    root.add(frame);

    //
    // =========================
    // MACRO PANELS (STRUCTURE)
    // =========================
    //
    const panelGroup = new THREE.Group();
    root.add(panelGroup);

    const panelGeo = new THREE.BoxGeometry(0.55, 0.3, 0.75);

    const panelMat = new THREE.MeshStandardMaterial({
      color: palette.panel,
      roughness: 0.85,
      metalness: 0.3
    });

    const panelPositions = [
      [-0.25,  0.25,  0.0],
      [ 0.25,  0.25,  0.0],
      [-0.25, -0.25,  0.0],
      [ 0.25, -0.25,  0.0],
      [ 0.0,   0.0,   0.75],
      [ 0.0,   0.0,  -0.75],
    ] as const;

    for (const [x, y, z] of panelPositions) {
      const panel = new THREE.Mesh(panelGeo, panelMat);

      panel.position.set(x, y, this.safeZ(z));

      panel.rotation.y = (Math.random() - 0.5) * 0.15;

      panelGroup.add(panel);
    }

    //
    // =========================
    // CORNER RAILS
    // =========================
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
    // =========================
    // ANCHORS (TETHER SYSTEM)
    // =========================
    //
    const frontAnchor = new THREE.Object3D();
    frontAnchor.position.set(0, 0, -0.85);
    root.add(frontAnchor);
    root.frontAnchor = frontAnchor;

    const rearAnchor = new THREE.Object3D();
    rearAnchor.position.set(0, 0, 0.85);
    root.add(rearAnchor);
    root.rearAnchor = rearAnchor;

    //
    // =========================
    // EMISSIVE STRIP (IDENTITY)
    // =========================
    //
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.06, 0.02),
      new THREE.MeshStandardMaterial({
        color: 0x111111,
        emissive: palette.emissive,
        emissiveIntensity: 2.4
      })
    );

    strip.position.set(0, 0.35, 0.81);
    root.add(strip);

    //
    // =========================
    // MEDIUM MODULES
    // =========================
    //
    const moduleGroup = new THREE.Group();
    root.add(moduleGroup);

    const moduleGeo = new THREE.BoxGeometry(0.6, 0.4, 0.7);

    const moduleMat = new THREE.MeshStandardMaterial({
      color: palette.body,
      roughness: 0.9,
      metalness: 0.2
    });

    for (let i = 0; i < 3; i++) {
      const mod = new THREE.Mesh(moduleGeo, moduleMat);

      mod.position.set(
        this.rand(-0.3, 0.3),
        this.rand(-0.2, 0.2),
        this.safeZ(this.rand(-0.7, 0.7))
      );

      mod.scale.set(
        this.rand(0.9, 1.3),
        this.rand(0.9, 1.2),
        this.rand(0.9, 1.4)
      );

      moduleGroup.add(mod);
    }

    //
    // =========================
    // VENTS (STRUCTURED DETAIL)
    // =========================
    //
    const ventGroup = new THREE.Group();
    root.add(ventGroup);

    const ventGeo = new THREE.BoxGeometry(0.25, 0.12, 0.08);

    const ventMat = new THREE.MeshStandardMaterial({
      color: 0x111318,
      roughness: 0.6,
      metalness: 0.8
    });

    for (let i = 0; i < 6; i++) {
      const vent = new THREE.Mesh(ventGeo, ventMat);

      vent.position.set(
        this.rand(-0.35, 0.35),
        this.rand(-0.25, 0.25),
        this.safeZ(this.rand(-0.8, 0.8))
      );

      vent.rotation.y = Math.random() * Math.PI;

      ventGroup.add(vent);
    }

    //
    // =========================
    // EMISSIVE NODES
    // =========================
    //
    const nodeGeo = new THREE.SphereGeometry(0.06, 6, 6);

    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      emissive: palette.emissive,
      emissiveIntensity: 2.2
    });

    const nodeCount = type === CargoType.CONTRABAND ? 3 : 2;

    for (let i = 0; i < nodeCount; i++) {
      const node = new THREE.Mesh(nodeGeo, nodeMat);

      const jitter = type === CargoType.CONTRABAND ? 1.15 : 1.0;

      node.position.set(
        this.rand(-0.5, 0.5) * jitter,
        this.rand(-0.4, 0.4) * jitter,
        this.safeZ(this.rand(-0.9, 0.9))
      );

      root.add(node);
    }

    //
    // =========================
    // OPTIONAL ANTENNA
    // =========================
    //
    if (Math.random() > 0.5) {
      const antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.4),
        new THREE.MeshStandardMaterial({
          color: 0x222222,
          metalness: 0.9,
          roughness: 0.4
        })
      );

      antenna.position.set(
        this.rand(-0.3, 0.3),
        0.6,
        this.safeZ(this.rand(-0.6, 0.6))
      );

      antenna.rotation.x = Math.random() * 0.5;

      root.add(antenna);
    }

    //
    // =========================
    // FINAL VARIATION
    // =========================
    //
    root.rotation.y = Math.random() * 0.2 - 0.1;

    return root;
  }

  private static getPalette(type: CargoType) {
    switch (type) {
      case CargoType.CONTRABAND:
        return {
          body: 0x3a2f33,
          panel: 0x2a2226,
          frame: 0x1c161a,
          rail: 0x120d10,
          emissive: 0xff1a12
        };

      case CargoType.SAFE:
      default:
        return {
          body: 0x5a6f77,
          panel: 0x3b4a50,
          frame: 0x2a3338,
          rail: 0x1b2226,
          emissive: 0x3ad6ff
        };
    }
  }
}