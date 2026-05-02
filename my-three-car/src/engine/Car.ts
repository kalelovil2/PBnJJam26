import * as THREE from "three";

export class Car {
  static FORWARD_Z = -1;

  mesh: THREE.Mesh;

  rotationSpeed = 0.05;

  velocityForward = 0;
  velocityStrafe = 0;

  angularVelocity = 0;
  maxTurnSpeed = 0.03;
  turnAccel = 0.0025;
  turnFriction = 0.9;

  keys: Record<string, boolean> = {};

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.5, 2),
      new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    );

    scene.add(this.mesh);

    window.addEventListener("keydown", (e) => (this.keys[e.key.toLowerCase()] = true));
    window.addEventListener("keyup", (e) => (this.keys[e.key.toLowerCase()] = false));
  }

  update() {
    const accel = 0.01;
    const friction = 0.92;

    // Rotation (A/D)
    if (this.keys["a"]) this.angularVelocity += this.turnAccel;
    if (this.keys["d"]) this.angularVelocity -= this.turnAccel;
    // clamp max turn speed
    this.angularVelocity = THREE.MathUtils.clamp(
      this.angularVelocity,
      -this.maxTurnSpeed,
      this.maxTurnSpeed
    );

    // apply damping
    this.angularVelocity *= this.turnFriction;

    // apply rotation
    this.mesh.rotation.y += this.angularVelocity;
    this.mesh.rotation.z = -this.angularVelocity * 2.5;

    // Forward / backward thrust (W/S)
    if (this.keys["w"]) this.velocityForward += accel;
    if (this.keys["s"]) this.velocityForward -= accel;

    // Strafe (Q/E)
    if (this.keys["q"]) this.velocityStrafe += accel;
    if (this.keys["e"]) this.velocityStrafe -= accel;

    // Apply friction
    this.velocityForward *= friction;
    this.velocityStrafe *= friction;

    const forwardLocal = new THREE.Vector3(0, 0, Car.FORWARD_Z);
    const rightLocal = new THREE.Vector3(1, 0, 0);

    const forward = forwardLocal.applyQuaternion(this.mesh.quaternion);
    const right = rightLocal.applyQuaternion(this.mesh.quaternion);

    this.mesh.position.addScaledVector(forward, this.velocityForward);
    this.mesh.position.addScaledVector(right, this.velocityStrafe);
  }
}