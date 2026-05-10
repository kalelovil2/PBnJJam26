import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import { getWorld } from "../physics";
import { ThrusterParticle } from "./ThrusterParticle";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export class Ship {
  static FORWARD_Z = -1;

  initialized = false;

  cachedPosition = new THREE.Vector3();
  cachedQuaternion = new THREE.Quaternion();
  cachedVelocity = new THREE.Vector3();
  cachedAngularVelocity = new THREE.Vector3();

  mesh: THREE.Group;
  visual: THREE.Mesh;
  body: RAPIER.RigidBody;

  keys: Record<string, boolean> = {};

  mainForwardLeft: THREE.Mesh;
  mainForwardRight: THREE.Mesh;

  mainReverse: THREE.Mesh;

  leftFront: THREE.Mesh;
  leftRear: THREE.Mesh;

  rightFront: THREE.Mesh;
  rightRear: THREE.Mesh;

  particles: ThrusterParticle[] = [];

  cameraMode = 0;

  createThruster(material: THREE.Material, isLarge: boolean = false) {
    const mesh = new THREE.Mesh(
      isLarge ? new THREE.ConeGeometry(0.18, 0.7, 8) : new THREE.ConeGeometry(0.1, 0.4, 8),
      material.clone()
    );

    mesh.rotation.x = -Math.PI / 2;

    return mesh;
  }

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    // -------------------------
    // Visual mesh
    // -------------------------
    this.mesh = new THREE.Group();
    this.visual = new THREE.Mesh(
      //new THREE.BoxGeometry(1, 0.5, 2),
      //new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    );
    this.mesh.add(this.visual);
    scene.add(this.mesh);

    loadModel(scene, this.mesh);

    // -------------------------
    // Physics body
    // -------------------------
    const world = getWorld();

    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setLinearDamping(0.6)   // prevents endless sliding
      .setAngularDamping(2.0)  // stabilises rotation
      .setCanSleep(false)
      .enabledRotations(false, true, false);

    this.body = world.createRigidBody(bodyDesc);

    const collider = RAPIER.ColliderDesc.cuboid(0.5, 0.25, 1);
    world.createCollider(collider, this.body);

    this.initialized = true;

    // -------------------------
    // Input
    // -------------------------
    window.addEventListener("keydown", (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();

      this.keys[key] = true;

      if (key === "c") {
        this.cameraMode = (this.cameraMode + 1) % 2;
      }
    });



    const mat = new THREE.MeshStandardMaterial({
      color: 0xff4400,
      emissive: 0xff2200,
      emissiveIntensity: 0,
    });

    // MAIN FORWARD
    this.mainForwardLeft = this.createThruster(mat, true);
    this.mainForwardRight = this.createThruster(mat, true);
    this.mainForwardLeft.position.set(-0.325, 0, 0.75);
    this.mainForwardRight.position.set(0.325, 0, 0.75);

    this.mainForwardLeft.rotation.x = -Math.PI / 2;
    this.mainForwardRight.rotation.x = -Math.PI / 2;
    this.mesh.add(this.mainForwardLeft);
    this.mesh.add(this.mainForwardRight);

    // MAIN REVERSE (optional small retro thruster at front)
    this.mainReverse = this.createThruster(mat);
    this.mainReverse.position.set(0, 0, -0.8);

    this.mainReverse.rotation.x = Math.PI / 2;
    this.mesh.add(this.mainReverse);

    // LEFT SIDE PAIR
    this.leftFront = this.createThruster(mat);
    this.leftRear = this.createThruster(mat);

    this.leftFront.position.set(-0.375, 0, -0.5);
    this.leftRear.position.set(-0.5, 0, 0.6);

    this.leftFront.rotation.z = -Math.PI / 2;
    this.leftRear.rotation.z = -Math.PI / 2;

    this.mesh.add(this.leftFront);
    this.mesh.add(this.leftRear);

    // RIGHT SIDE PAIR
    this.rightFront = this.createThruster(mat);
    this.rightRear = this.createThruster(mat);

    this.rightFront.position.set(0.375, 0, -0.5);
    this.rightRear.position.set(0.5, 0, 0.6);

    // face right (+X)w
    this.rightFront.rotation.z = Math.PI / 2;
    this.rightRear.rotation.z = Math.PI / 2;

    this.mesh.add(this.rightFront);
    this.mesh.add(this.rightRear);
  }

  updateControls() {
    if (!this.initialized) return;

    const reset = (m: THREE.Mesh) => {
      (m.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
    };

    reset(this.mainForwardLeft);
    reset(this.mainForwardRight);
    reset(this.mainReverse);
    reset(this.leftFront);
    reset(this.leftRear);
    reset(this.rightFront);
    reset(this.rightRear);

    const thrust = 0.05;
    const turnTorque = 0.01125;

    // IMPORTANT:
    // use mesh quaternion instead of body.rotation()
    // avoids Rapier aliasing issue
    const forward = new THREE.Vector3(
      0,
      0,
      Ship.FORWARD_Z
    ).applyQuaternion(this.mesh.quaternion);

    const right = new THREE.Vector3(
      1,
      0,
      0
    ).applyQuaternion(this.mesh.quaternion);

    // -------------------------
    // THRUST (W/S)
    // -------------------------

    if (this.keys["w"]) {
      this.body.applyImpulse(
        {
          x: forward.x * thrust,
          y: 0,
          z: forward.z * thrust
        },
        false
      );

      (this.mainForwardLeft.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.5;
      (this.mainForwardRight.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.5;

      this.spawnThrusterParticles(this.mainForwardLeft, 4, 0.1);
      this.spawnThrusterParticles(this.mainForwardRight, 4, 0.1);
    }

    if (this.keys["s"]) {
      this.body.applyImpulse(
        {
          x: -forward.x * thrust,
          y: 0,
          z: -forward.z * thrust
        },
        false
      );

      (this.mainReverse.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5;

      this.spawnThrusterParticles(this.mainReverse, 2, 0.06);
    }

    // -------------------------
    // STRAFE (Q/E)
    // -------------------------

    if (this.keys["q"]) {
      this.body.applyImpulse(
        {
          x: -right.x * thrust,
          y: 0,
          z: -right.z * thrust
        },
        false
      );

      (this.rightFront.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5;
      (this.rightRear.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5;

      this.spawnThrusterParticles(this.rightFront, 2, 0.05);
      this.spawnThrusterParticles(this.rightRear, 2, 0.05);
    }

    if (this.keys["e"]) {
      this.body.applyImpulse(
        {
          x: right.x * thrust,
          y: 0,
          z: right.z * thrust
        },
        false
      );

      (this.leftFront.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5;
      (this.leftRear.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5;

      this.spawnThrusterParticles(this.leftFront, 2, 0.05);
      this.spawnThrusterParticles(this.leftRear, 2, 0.05);
    }

    // -------------------------
    // TURNING (A/D)
    // -------------------------

    if (this.keys["a"]) {
      this.body.applyTorqueImpulse(
        {
          x: 0,
          y: turnTorque,
          z: 0
        },
        false
      );

      (this.rightFront.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5;
      (this.leftRear.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5;

      this.spawnThrusterParticles(this.rightFront, 2, 0.05);
      this.spawnThrusterParticles(this.leftRear, 2, 0.05);
    }

    if (this.keys["d"]) {
      this.body.applyTorqueImpulse(
        {
          x: 0,
          y: -turnTorque,
          z: 0
        },
        false
      );

      (this.leftFront.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5;
      (this.rightRear.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5;

      this.spawnThrusterParticles(this.leftFront, 2, 0.05);
      this.spawnThrusterParticles(this.rightRear, 2, 0.05);
    }
  }

  syncFromPhysics() {
    if (!this.initialized) return;

    const pos = this.body.translation();
    const rot = this.body.rotation();
    const vel = this.body.linvel();
    const angVel = this.body.angvel();

    this.cachedPosition.set(pos.x, pos.y, pos.z);

    this.cachedQuaternion.set(
      rot.x,
      rot.y,
      rot.z,
      rot.w
    );

    this.cachedVelocity.set(
      vel.x,
      vel.y,
      vel.z
    );

    this.cachedAngularVelocity.set(
      angVel.x,
      angVel.y,
      angVel.z
    );

    this.mesh.position.copy(this.cachedPosition);
    this.mesh.quaternion.copy(this.cachedQuaternion);

    // FAKE BODY ROLL/PITCH

    const targetRoll = -angVel.y * 0.25;

    this.visual.rotation.z = THREE.MathUtils.lerp(
      this.visual.rotation.z,
      targetRoll,
      0.15
    );

    const forward = new THREE.Vector3(
      0,
      0,
      Ship.FORWARD_Z
    ).applyQuaternion(this.mesh.quaternion);

    const forwardSpeed =
      vel.x * forward.x +
      vel.z * forward.z;

    const targetPitch = forwardSpeed * 0.05;

    this.visual.rotation.x = THREE.MathUtils.lerp(
      this.visual.rotation.x,
      targetPitch,
      0.1
    );

    this.particles = this.particles.filter(p => {
      const alive = p.update();

      if (!alive) {
        this.mesh.parent?.remove(p.mesh);
      }

      return alive;
    });
  }

  updateCamera(camera: THREE.Camera) {
    // TOP-DOWN FOLLOW CAMERA
    if (this.cameraMode === 0) {
      const targetPos = new THREE.Vector3(
        this.mesh.position.x,
        this.mesh.position.y + 8,
        this.mesh.position.z + 10
      );

      camera.position.lerp(targetPos, 0.1);

      camera.lookAt(this.mesh.position);
    }

    // BEHIND-THE-SHIP CAMERA
    else {
      const velocityVec = this.cachedVelocity;

      const forward = new THREE.Vector3(
        0,
        0,
        Ship.FORWARD_Z
      ).applyQuaternion(this.mesh.quaternion);

      // signed forward speed
      const forwardSpeed = velocityVec.dot(forward);

      const behindOffset = forward
        .clone()
        .multiplyScalar(-4 - Math.abs(forwardSpeed) * 0.25);

      const targetPos = this.mesh.position
        .clone()
        .add(behindOffset)
        .add(new THREE.Vector3(0, 3, 0));

      camera.position.lerp(targetPos, 0.1);

      // look slightly ahead of ship
      const lookTarget = this.mesh.position
        .clone()
        .add(forward.multiplyScalar(5));

      camera.lookAt(lookTarget);
      
      const angVel = this.cachedAngularVelocity;

      camera.rotateZ(-angVel.y * -0.025);
    }
  }

  spawnThrusterParticles(thruster: THREE.Mesh, count = 1, size: number = 0.03) {
    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();

    thruster.matrixWorld.decompose(worldPos, worldQuat, worldScale);

    // local direction of exhaust (cone tip direction in your setup)
    const exhaustDir = new THREE.Vector3(0, 1, 0).applyQuaternion(worldQuat);

    // cone height approximation (0.4 or 0.7 depending on large/small)
    const coneHeight = (thruster.geometry as THREE.ConeGeometry).parameters.height ?? 0.4;

    // move from pivot → tip
    const spawnPos = worldPos.clone().add(exhaustDir.multiplyScalar(coneHeight * -0.5));

    for (let i = 0; i < count; i++) {
      const p = new ThrusterParticle(spawnPos, size);

      this.particles.push(p);
      this.mesh.parent?.add(p.mesh);
    }
  }

  getAttachmentPointRear(worldPoint = new THREE.Vector3()) {
    this.mesh.getWorldPosition(worldPoint);

    const quat = this.mesh.quaternion;

    const offset = new THREE.Vector3(0, 0, 0.625); // rear hitch point

    offset.applyQuaternion(quat);
    worldPoint.add(offset);

    return worldPoint;
  }
}

async function loadModel(scene: THREE.Scene<THREE.Object3DEventMap>, mesh: THREE.Group<THREE.Object3DEventMap>) {
  const loader = new GLTFLoader();

  await loader.loadAsync("./player_v01.glb").then((glb) => {
    const model = glb.scene;
    model.scale.set(0.075, 0.075, 0.075);       // Adjust model scale
    model.position.set(0, 0, 0);    // Adjust model position
    model.rotation.set(0, 0, 0);
    model.rotation.y = Math.PI;
    mesh.add(model);
  });
}

const CONE_FORWARD_FIX = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(Math.PI / 2, 0, 0)
);