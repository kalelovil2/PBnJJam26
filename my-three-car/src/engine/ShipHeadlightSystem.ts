import * as THREE from "three";
import { Ship } from "./Ship";

export class ShipHeadlightSystem {
  private light: THREE.PointLight;
//   private glow: THREE.Mesh;

  private offset = new THREE.Vector3(0, 0, -1.2);
  
  private ship: Ship;
private scene: THREE.Scene;

constructor(ship: Ship, scene: THREE.Scene) 
{
  this.ship = ship;
  this.scene = scene;
    //
    // MAIN LIGHT
    //
    this.light = new THREE.PointLight(
  0x9ecbff,
  7.5,   // lower max strength
  1500,    // much longer reach
  0.5    // gentler falloff
);
    this.scene.add(this.light);

    //
    // VISUAL GLOW NODE (optional but very effective)
    //
    // this.glow = new THREE.Mesh(
    //   new THREE.SphereGeometry(0.08, 10, 10),
    //   new THREE.MeshBasicMaterial({
    //     color: 0x9ecbff,
    //     transparent: true,
    //     opacity: 0.35
    //   })
    // );

    // this.ship.mesh.add(this.glow);
    // this.glow.position.copy(this.offset);
  }

  update() {
    //
    // get ship transform
    //
    const pos = this.ship.body.translation();
    const rot = this.ship.body.rotation();

    const quat = new THREE.Quaternion(
      rot.x,
      rot.y,
      rot.z,
      rot.w
    );

    //
    // compute forward offset
    //
    const worldOffset = this.offset.clone().applyQuaternion(quat);

    const worldPos = new THREE.Vector3(
      pos.x,
      pos.y,
      pos.z
    ).add(worldOffset);

    //
    // apply to light
    //
    this.light.position.copy(worldPos);

    //
    // optional subtle follow smoothing (prevents jitter)
    //
    this.light.intensity = 1.1 + Math.sin(Date.now() * 0.002) * 0.05;
  }

  dispose() {
    this.scene.remove(this.light);
    // this.glow.removeFromParent();
  }
}