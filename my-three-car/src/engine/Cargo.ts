import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import { getWorld } from "../physics";

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

  type: CargoType;

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
      .setLinearDamping(0.25)
      .setAngularDamping(2.75);

    const world = getWorld();

    this.body = world.createRigidBody(bodyDesc);

    this.body.setLinvel(
      {
        x: (Math.random() - 0.5) * 0.75,
        y: 0,
        z: (Math.random() - 0.5) * 0.75
      },
      false
    );

    const collider = RAPIER.ColliderDesc
      .cuboid(0.5, 0.5, 1)
      .setMass(0.2);

    world.createCollider(collider, this.body);

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
  }

  sync() {
    const pos = this.body.translation();
    const rot = this.body.rotation();

    this.mesh.position.set(pos.x, pos.y, pos.z);
    this.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
  }
}