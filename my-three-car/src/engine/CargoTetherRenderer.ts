import * as THREE from "three";
import { Cargo } from "./Cargo";
import { Ship } from "./Ship";

export class CargoTetherRenderer {
  scene: THREE.Scene;

  cables: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  update(ship: Ship, cargoChain: Cargo[]) {
    this.ensureCableCount(cargoChain.length);

    // hide unused
    for (let i = 0; i < this.cables.length; i++) {
      this.cables[i].visible = i < cargoChain.length;
    }

    // update each cable segment
    for (let i = 0; i < cargoChain.length; i++) {
      const start = new THREE.Vector3();
      const end = new THREE.Vector3();

      if (i === 0) {
        ship.getAttachmentPointRear(start);
      } else {
        cargoChain[i - 1].getAttachmentPointRear(start);
      }

      cargoChain[i].getAttachmentPointFront(end);

      this.updateCable(this.cables[i], start, end);
    }
  }

  ensureCableCount(count: number) {
    while (this.cables.length < count) {
      const cable = this.createCable();
      this.cables.push(cable);
      this.scene.add(cable);
    }
  }

  createCable(): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);

    const material = new THREE.MeshStandardMaterial({
      color: 0x66ccff,
      emissive: 0x2244ff,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.6,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // cylinder is vertical by default → rotate to align with Z axis
    mesh.rotation.x = Math.PI / 2;

    return mesh;
  }

updateCable(
  cable: THREE.Mesh,
  start: THREE.Vector3,
  end: THREE.Vector3
) {
  const dir = new THREE.Vector3().subVectors(end, start);
  const length = dir.length();

  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

  // position at midpoint
  cable.position.copy(mid);

  // IMPORTANT: scale along Y (cylinder’s natural axis)
  cable.scale.set(1, length, 1);

  // align Y axis to direction
  const yAxis = new THREE.Vector3(0, 1, 0);

  cable.quaternion.setFromUnitVectors(yAxis, dir.clone().normalize());
}
}