import * as THREE from "three";
import { CargoType } from "./Cargo/Cargo";

export class SellZone {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  radius: number;
  type: CargoType;

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3,
    type: CargoType
  ) {
    this.position = position;
    this.type = type;
    this.radius = 2;

    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(this.radius, 16, 16),
      new THREE.MeshBasicMaterial({
        wireframe: true,
        transparent: true,
        opacity: 0.2,
        color: type === CargoType.SAFE ? 0x66ff99 : 0xff3355
      })
    );

    this.mesh.position.copy(position);
    scene.add(this.mesh);
  }
}