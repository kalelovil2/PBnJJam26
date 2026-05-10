import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import { getWorld } from "../physics";
import type { Ship } from "./Ship";

export const CargoType = {
  SAFE: "SAFE",
  CONTRABAND: "CONTRABAND"
} as const;

export type CargoType =
  typeof CargoType[keyof typeof CargoType];

const textureLoader = new THREE.TextureLoader();

const safeDecalTexture =
  textureLoader.load("/textures/SafeCargo_Feijoas_v01.png");

const contrabandDecalTexture =
  textureLoader.load("/textures/BannedCargo_CoffeeBeans_v02.png");

const DECAL_OFFSET = 0.05;


export class Cargo {
  mesh: THREE.Mesh;
  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  joint: RAPIER.ImpulseJoint | null = null;

  attached = false;

  followTarget:
    | Cargo
    | Ship
    | null = null;

  followDistance = 3.2;

  type: CargoType;

  followPosition = new THREE.Vector3();

  isCapturing = false;

  captureTimer = 0;

  defaultCollisionGroups = 0;

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3,
    type: CargoType
  ) {
    this.type = type;

    const color =
      type === CargoType.CONTRABAND
        ? 0xff0066
        : 0x00ffaa;

    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1, 1.6),
      new THREE.MeshStandardMaterial({
        color
      })
    );

    this.mesh.position.copy(position);

    const q = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        0,
        Math.random() * Math.PI * 2,
        0
      )
    );
    this.mesh.rotation.set(q.x, q.y, q.z);

    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y, position.z)
      .setLinearDamping(0.4)
      .setAngularDamping(0.6)
      .setCanSleep(false);

    const world = getWorld();

    this.body = world.createRigidBody(bodyDesc);

    this.body.setAdditionalMass(
      0.5,
      true
    );

    this.body.setLinvel(
      {
        x: (Math.random() - 0.5) * 0.75,
        y: 0,
        z: (Math.random() - 0.5) * 0.75
      },
      false
    );

    const colliderDesc = RAPIER.ColliderDesc
      .cuboid(0.5, 0.5, 1)
      .setMass(0.25);

    this.collider = world.createCollider(
      colliderDesc,
      this.body
    );

    this.defaultCollisionGroups =
      this.collider.collisionGroups();

    this.collider.setFriction(0.2);
    this.collider.setRestitution(0.0);

    const decalTexture =
      type === CargoType.CONTRABAND
        ? contrabandDecalTexture
        : safeDecalTexture;

    const decalMaterial = new THREE.MeshStandardMaterial({
      map: decalTexture,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      side: THREE.DoubleSide
    });

    const decalGeometry = new THREE.PlaneGeometry(0.7, 0.7);

    const frontDecal = new THREE.Mesh(
      decalGeometry,
      decalMaterial
    );

    frontDecal.position.set(0, 0, -(0.8 + DECAL_OFFSET));

    this.mesh.add(frontDecal);

    const backDecal = new THREE.Mesh(
      decalGeometry,
      decalMaterial
    );

    backDecal.position.set(0, 0, (0.8 + DECAL_OFFSET));
    backDecal.rotation.y = Math.PI;

    this.mesh.add(backDecal);

    const leftDecal = new THREE.Mesh(
      decalGeometry,
      decalMaterial
    );

    leftDecal.position.set(-0.46, 0, 0);
    leftDecal.rotation.y = -Math.PI / 2;

    this.mesh.add(leftDecal);

    const rightDecal = new THREE.Mesh(
      decalGeometry,
      decalMaterial
    );

    rightDecal.position.set(0.46, 0, 0);
    rightDecal.rotation.y = Math.PI / 2;

    this.mesh.add(rightDecal);

    scene.add(this.mesh);

    this.followPosition.copy(position);
  }

  updateCaptureFollow() {
    const targetBody = this.followTarget.body;

    //
    // TARGET TRANSFORM
    //

    const targetPos = targetBody.translation();

    const targetRot = targetBody.rotation();

    const targetQuat = new THREE.Quaternion(
      targetRot.x,
      targetRot.y,
      targetRot.z,
      targetRot.w
    );

    //
    // DESIRED POSITION
    //

    const offset = new THREE.Vector3(
      0,
      0,
      this.followDistance
    );

    offset.applyQuaternion(targetQuat);

    const desiredPos = new THREE.Vector3(
      targetPos.x,
      targetPos.y,
      targetPos.z
    ).add(offset);

    //
    // SMOOTH FOLLOW
    //

    const followStrength =
      this.isCapturing
        ? 0.04
        : 0.14;

    this.body.setAngularDamping(4.0);

    this.followPosition.lerp(
      desiredPos,
      followStrength
    );

    //
    // CURRENT POSITION
    //

    const currentPos = this.body.translation();

    //
    // COMPUTE VELOCITY FROM POSITION ERROR
    //

    const correction = new THREE.Vector3(
      this.followPosition.x - currentPos.x,
      this.followPosition.y - currentPos.y,
      this.followPosition.z - currentPos.z
    );

    //
    // SOFT VELOCITY
    //

    const velocity = {
      x: correction.x * 8,
      y: correction.y * 8,
      z: correction.z * 8
    };

    //
    // APPLY VELOCITY
    //

    this.body.setLinvel(
      velocity,
      true
    );

    const angVel = this.body.angvel();
  }

  updateAttachedMotion() {
    if (!this.attached || !this.followTarget) {
      return;
    }

    //
    // CAPTURE MODE
    //

    if (this.isCapturing) {
      this.updateCaptureFollow();
      return;
    }

    //
    // once jointed,
    // real physics handles movement
    //
  }

  updateCapture(delta: number) {
    if (!this.isCapturing) {
      return;
    }

    this.captureTimer -= delta;

    //
    // slowly damp velocity
    //

    const vel = this.body.linvel();

    this.body.setAngularDamping(1.0);

    this.body.setLinvel(
      {
        x: vel.x * 0.9,
        y: vel.y * 0.9,
        z: vel.z * 0.9
      },
      true
    );

    //
    // finish capture
    //

    if (this.captureTimer <= 0) {
      this.isCapturing = false;

      const parentVel =
        this.followTarget.body.linvel();

      this.body.setLinvel(
        {
          x: parentVel.x,
          y: parentVel.y,
          z: parentVel.z
        },
        true
      );

      this.body.setAngvel(
        { x: 0, y: 0, z: 0 },
        true
      );

      this.createJoint();

      //
      // re-enable collisions
      //

      this.collider.setCollisionGroups(
        this.defaultCollisionGroups
      );
    }
  }

  createJoint() {
    if (!this.followTarget) return;

    const world = getWorld();

    const parentBody = this.followTarget.body;

    if (this.joint) {
      world.removeImpulseJoint(this.joint, true);
      this.joint = null;
    }

    const isShip =
      this.followTarget.constructor.name === "Ship";

    // anchor points in local space
    const parentAnchor = isShip
      ? { x: 0, y: 0, z: 1.4 } // farther behind ship
      : { x: 0, y: 0, z: 1.1 };
    const childAnchor = { x: 0, y: 0, z: -1.1 }; // FRONT of cargo

    const jointData = RAPIER.JointData.spring(
      0.2, // rest length
      75.0, // stiffness
      35.0, // damping
      parentAnchor,
      childAnchor
    );

    this.joint = world.createImpulseJoint(
      jointData,
      parentBody,
      this.body,
      true
    );
  }

  getAttachmentPointFront(worldPoint = new THREE.Vector3()) {
    this.mesh.getWorldPosition(worldPoint);

    const quat = this.mesh.quaternion;

    const offset = new THREE.Vector3(0, 0, -0.8);

    offset.applyQuaternion(quat);
    worldPoint.add(offset);

    return worldPoint;
  }

  getAttachmentPointRear(worldPoint = new THREE.Vector3()) {
    this.mesh.getWorldPosition(worldPoint);

    const quat = this.mesh.quaternion;

    const offset = new THREE.Vector3(0, 0, 0.8);

    offset.applyQuaternion(quat);
    worldPoint.add(offset);
    return worldPoint;
  }

  sync() {
    const pos = this.body.translation();
    const rot = this.body.rotation();

    this.mesh.position.set(pos.x, pos.y, pos.z);
    this.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
  }
}