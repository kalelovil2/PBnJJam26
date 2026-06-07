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

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    this.position = position.clone();

    this.mesh = new THREE.Group();
    this.visuals = new ScannerVisuals();

    // -------------------------
    // BODY
    // -------------------------

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(
        this.cylinderRadius,
        this.cylinderRadius,
        4,
        8
      ),
      this.visuals.createBodyMaterial()
    );

    this.mesh.add(body);

    // -------------------------
    // BEAM
    // -------------------------

    this.beamMat = this.visuals.createBeamMaterial(
      this.visuals.createBeamTexture()
    );

    const beamGeometry = this.visuals.createBeamGeometry(
      this.beamWidth * 2,
      this.radius
    );

    const beams = this.visuals.createBeamPlanes(
      beamGeometry,
      this.beamMat
    );

    this.beamA = beams.a;
    this.beamB = beams.b;

    this.visuals.positionBeam(this.beamA, this.radius);
    this.visuals.positionBeam(this.beamB, this.radius);

    this.beamGroup = new THREE.Group();
    this.beamGroup.add(this.beamB);

    // -------------------------
    // CORE
    // -------------------------

    this.coreMat = this.visuals.createCoreMaterial();

    const core = this.visuals.createCoreMesh(
      this.visuals.createCoreGeometry(this.radius),
      this.coreMat
    );

    this.visuals.positionCore(core, this.radius);

    this.beamGroup.add(core);

    this.beamGroup.position.z = this.cylinderRadius + 0.01;

    this.mesh.add(this.beamGroup);

    // -------------------------
    // FX
    // -------------------------

    const beacon = new THREE.PointLight(0x66ddff, 2, 15);
    beacon.position.y = 1.5;
    this.mesh.add(beacon);

    const ring = this.visuals.createRing();
    this.visuals.positionRing(ring, this.cylinderRadius);
    this.mesh.add(ring);

    this.mesh.position.copy(position);
    scene.add(this.mesh);
  }

  // -------------------------
  // UPDATE
  // -------------------------

  update(dt: number) {
    this.rotation += this.rotationSpeed * dt;
    this.mesh.rotation.y = this.rotation;

    this.alertTimer = Math.max(0, this.alertTimer - dt);

    this.beamMat.color.setHex(
      this.alertTimer > 0 ? 0xff3333 : 0x66ddff
    );

    this.pulseTime += dt;
    this.flickerTime += dt;

    const flicker =
      1.0 + Math.sin(this.flickerTime * 2.0) * 0.1;

    this.beamMat.opacity = 0.2 * flicker;

    const fadeZone = 3.0;

    let coreFade = 1.0;

    if (this.radius > fadeZone) {
      coreFade = (this.radius - fadeZone) / this.radius;
    }

    this.coreMat.opacity = 0.05 * coreFade * coreFade;
  }

  // -------------------------
  // DETECTION
  // -------------------------

  detects(position: THREE.Vector3): boolean {
    const offset = position.clone().sub(this.mesh.position);

    const beamDir = new THREE.Vector3(0, 0, 1).applyQuaternion(
      this.mesh.quaternion
    );

    const forward = offset.dot(beamDir);

    if (forward < 0 || forward > this.radius) return false;

    const closestPoint = beamDir.clone().multiplyScalar(forward);

    const sideways = offset.clone().sub(closestPoint).length();

    return sideways < this.beamWidth;
  }

  triggerAlert() {
    this.alertTimer = 1.0;
  }
}