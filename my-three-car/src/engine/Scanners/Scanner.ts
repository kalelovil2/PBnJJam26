import * as THREE from "three";

export class Scanner {
  mesh: THREE.Group;

  private beam: THREE.Mesh;

  position: THREE.Vector3;

  radius = 60;
  beamWidth = 2;

  rotation = 0;
  rotationSpeed = 0.25;

  private alertTimer = 0;

  private beamMat: THREE.MeshBasicMaterial;

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3
  ) {
    this.position = position.clone();

    this.mesh = new THREE.Group();

    //
    // Scanner body
    //

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(
        1.5,
        1.5,
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

    this.beam = new THREE.Mesh(
      new THREE.BoxGeometry(
        this.beamWidth,
        0.5,
        this.radius
      ),
      this.beamMat = new THREE.MeshBasicMaterial({
        color: 0x66ddff,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }));

    this.beam.position.z =
      this.radius * 0.5;

    this.mesh.add(this.beam);

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