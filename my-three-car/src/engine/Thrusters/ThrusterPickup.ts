import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import { getWorld } from "../../physics";
import { Ship } from "../Ship/Ship";

export class ThrusterPickup {

  mesh: THREE.Group;

  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;

  attached = false;
  isSpent = false;

  fuelCapacity = 100;
  fuelRemaining = 100;

  thrustBonus = 0.5;

  ship: Ship | null = null;

  private hardpoint =
    new THREE.Vector3();

  private glowMat:
    THREE.MeshStandardMaterial;

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3
  ) {

    //
    // visuals
    //

    this.glowMat =
      new THREE.MeshStandardMaterial({
        color: 0xff6333,
        emissive: 0xffaa33,
        emissiveIntensity: 2
      });

    const bodyMesh =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.3,
          0.3,
          1.2
        ),
        new THREE.MeshStandardMaterial({
          color: 0x666666
        })
      );

    const nozzle =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.25,
          0.4,
          0.3,
          8
        ),
        this.glowMat
      );

    bodyMesh.rotation.x =
      Math.PI / 2;

    nozzle.rotation.x =
      -Math.PI / 2;

    nozzle.position.z =
      0.9;

    this.mesh = new THREE.Group();

    this.mesh.add(bodyMesh);
    this.mesh.add(nozzle);

    scene.add(this.mesh);

    //
    // physics
    //

    const world =
      getWorld();

    this.body =
      world.createRigidBody(
        RAPIER.RigidBodyDesc
          .dynamic()
          .setTranslation(
            position.x,
            position.y,
            position.z
          )
      );

    (this.body as any).userData = {
      type: "thruster",
      ref: this
    };

    this.collider =
      world.createCollider(
        RAPIER.ColliderDesc
          .cuboid(
            0.35,
            0.35,
            0.8
          ),
        this.body
      );
  }

  attachToShip(
    ship: Ship,
    slot: number
  ) {

    this.ship = ship;

    this.attached = true;

    //
    // hardpoints
    //

    const hardpoints = [

      new THREE.Vector3(
        -0.8,
        0,
        0.6
      ),

      new THREE.Vector3(
        0.8,
        0,
        0.6
      ),

      new THREE.Vector3(
        -0.8,
        0,
        -0.6
      ),

      new THREE.Vector3(
        0.8,
        0,
        -0.6
      )

    ];

    this.hardpoint.copy(
      hardpoints[
      slot %
      hardpoints.length
      ]
    );

    //
    // stop physics
    //

    this.body.setLinvel(
      { x: 0, y: 0, z: 0 },
      true
    );

    this.body.setAngvel(
      { x: 0, y: 0, z: 0 },
      true
    );

    this.body.setEnabled(false);
  }

  getThrustBonus() {

    if (
      !this.attached ||
      this.isSpent
    ) {
      return 0;
    }

    return this.thrustBonus;
  }

  consumeFuel(dt: number) {

    //console.log("Remaining fuel 1: ", this.fuelRemaining)
    if (
      !this.attached ||
      this.isSpent
    ) {
      return;
    }

    this.fuelRemaining -= dt * 5;
    //console.log("Remaining fuel 2: ", this.fuelRemaining)

    if (
      this.fuelRemaining <= 0
    ) {
      this.fuelRemaining = 0;

      this.detach();
    }
  }

  detach() {

    if (
      this.isSpent
    ) {
      return;
    }

    this.isSpent = true;
    this.attached = false;

    this.glowMat.emissiveIntensity = 0;

    this.body.setEnabled(true);

    const worldPos =
      new THREE.Vector3();

    this.mesh.getWorldPosition(
      worldPos
    );

    this.body.setTranslation(
      worldPos,
      true
    );

    this.body.applyImpulse(
      {
        x:
          (Math.random() - 0.5) *
          2,

        y: 0,

        z:
          (Math.random() - 0.5) *
          2
      },
      true
    );
  }

  update(dt: number) {

    if (
      this.attached &&
      this.ship
    ) {

      const worldPos =
        this.hardpoint
          .clone()
          .applyQuaternion(
            this.ship.mesh.quaternion
          )
          .add(
            this.ship.mesh.position
          );

      this.mesh.position.copy(
        worldPos
      );

      this.mesh.quaternion.copy(
        this.ship.mesh.quaternion
      );
    }

    else {

      const pos =
        this.body.translation();

      const rot =
        this.body.rotation();

      this.mesh.position.set(
        pos.x,
        pos.y,
        pos.z
      );

      this.mesh.quaternion.set(
        rot.x,
        rot.y,
        rot.z,
        rot.w
      );
    }

    //
    // fuel glow
    //

    if (!this.isSpent) {

      const fuel =
        this.fuelRemaining /
        this.fuelCapacity;



      this.glowMat.emissiveIntensity = (fuel > 0.999) ? 0.15 :
        0.25 + fuel * 2.75;

      const color = new THREE.Color();

      if (fuel > 0) {

        //
        // interpolate:
        // grey -> red -> orange
        //

          color.lerpColors(
            new THREE.Color(0x555555),
            new THREE.Color(0xff4033),
            fuel * 2
          );

      } else {

        color.setHex(0x444444);

      }

      this.glowMat.color.copy(color);
      this.glowMat.emissive.copy(color);
    }
  }
}