import * as THREE from "three";
import { ScannerVisuals } from "./ScannerVisuals";

export class Scanner {
  mesh: THREE.Group;

  private beamGroup: THREE.Group;

  private beamA: THREE.Mesh;
  private beamB: THREE.Mesh;

  private visuals: ScannerVisuals;

  position: THREE.Vector3;

  radius = 17.5;
  cylinderRadius = 1.5;
  beamWidth = 3.25;

  rotation = 0;
  rotationSpeed = 0.25;

  private alertTimer = 0;

  private beamMat: THREE.MeshBasicMaterial;
  private coreMat!: THREE.MeshBasicMaterial;

  private pulseTime = 5 + Math.random() * 5;

  private flickerTime = Math.random() * 100;

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3
  ) {
    this.position = position.clone();

    this.mesh = new THREE.Group();

    this.visuals = new ScannerVisuals();

    //
    // Scanner body
    //

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(
        this.cylinderRadius,
        this.cylinderRadius,
        4,
        8
      ),
      new THREE.MeshStandardMaterial({
        color: 0x88ccff,
        emissive: 0x224466,
        emissiveIntensity: 1
      })
    );

    this.mesh.add(body);

    //
    // Beam
    //

    this.beamMat = new THREE.MeshBasicMaterial({
      color: 0x77ccff,
      map: this.visuals.createBeamTexture(),
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const beamGeometry =
      new THREE.PlaneGeometry(
        this.beamWidth * 2,
        this.radius
      );

    this.beamA = new THREE.Mesh(
      beamGeometry,
      this.beamMat
    );

    this.beamB = new THREE.Mesh(
      beamGeometry,
      this.beamMat
    );

    //
    // PlaneGeometry length is Y,
    // rotate so length points forward (Z)
    //

    this.beamA.rotation.x =
      -Math.PI / 2;

    this.beamB.rotation.set(
  -Math.PI / 2,
  Math.PI / 2,
  0
);

    //
    // Move both planes forward
    //

    this.beamA.position.z =
      this.radius * 0.5;

    this.beamB.position.z =
      this.radius * 0.5;

    this.beamGroup =
      new THREE.Group();

    // this.beamGroup.add(
    //   this.beamA
    // );

    this.beamGroup.add(
      this.beamB
    );

    
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x99ddff,
    transparent: true,
    opacity: 0.05,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  this.coreMat = coreMat;

    const core = new THREE.Mesh(
  new THREE.CylinderGeometry(
    0.95,
    0.25,
    this.radius,
    8
  ),
  coreMat
);

core.rotation.x = Math.PI / 2;
core.position.z = this.radius * 0.5;

this.beamGroup.add(core);

    const startOffset = this.cylinderRadius+0.01;

this.beamGroup.position.z =
  startOffset;

    this.mesh.add(
      this.beamGroup
    );
    




    //
    // Marker light
    //

    const beacon = new THREE.PointLight(
      0x66ddff,
      2,
      15
    );

    beacon.position.y = 1.5;

    this.mesh.add(beacon);

    // Glow Ring

    const ring = new THREE.Mesh(
  new THREE.RingGeometry(0.025, 0.25, 32),
  new THREE.MeshBasicMaterial({
    color: 0x66ccff,
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
);

ring.rotation.z = Math.PI / 2;
ring.position.z = this.cylinderRadius;

this.mesh.add(ring);

    this.mesh.position.copy(position);

    scene.add(this.mesh);
  }

  update(dt: number) {
    this.rotation +=
      this.rotationSpeed * dt;

    this.mesh.rotation.y =
      this.rotation;

    this.alertTimer = Math.max(
      0,
      this.alertTimer - dt
    );

    if (this.alertTimer > 0) {
      this.beamMat.color.setHex(0xff3333);
    } else {
      this.beamMat.color.setHex(0x66ddff);
    }

    this.pulseTime += dt;

    this.flickerTime += dt;

    const flicker =
      1.0 +
      Math.sin(this.flickerTime * 2.0) * 0.1;

    this.beamMat.opacity =
      0.2 * flicker;

      const fadeStart = this.radius - 2.0;

const fadeZone = 3.0;

let coreFade = 1.0;

if (this.radius > fadeZone) {
  coreFade =
    Math.max(
      0,
      (this.radius - fadeZone) / this.radius
    );
}

coreFade = coreFade * coreFade;

this.coreMat.opacity = 0.05 * coreFade;

// const fade =
//   1.0 - (Math.sin(this.pulseTime * 0.5) * 0.05);

// const length = this.radius * fade;

// this.beamA.scale.y = fade;
// this.beamB.scale.y = fade;

//     this.beamA.position.z =
//       length * 0.5;

//     this.beamB.position.z =
//       length * 0.5;
  }

  detects(position: THREE.Vector3): boolean {
    const offset =
      position.clone().sub(
        this.mesh.position
      );

    //
    // Beam forward direction
    //

    const beamDir =
      new THREE.Vector3(0, 0, 1)
        .applyQuaternion(
          this.mesh.quaternion
        );

    const forward =
      offset.dot(beamDir);

    if (
      forward < 0 ||
      forward > this.radius
    ) {
      return false;
    }

    const closestPoint =
      beamDir.clone()
        .multiplyScalar(forward);

    const sideways =
      offset
        .clone()
        .sub(closestPoint)
        .length();

    return sideways <
      this.beamWidth;
  }

  triggerAlert() {
    this.alertTimer = 1.0;
  }
}
