import * as THREE from "three";
import { world, eventQueue } from "../physics";
import RAPIER from "@dimforge/rapier3d";
import { Cargo } from "./Cargo";

export class DamageSystem {
  cargoLookup = new Map<number, Cargo>();

  onImpact?: (
    position: THREE.Vector3,
    normal: THREE.Vector3,
    strength: number
  ) => void;

  registerCargo(cargo: Cargo) {
    this.cargoLookup.set(cargo.body.handle, cargo);
  }

  update() {
    eventQueue.drainCollisionEvents((h1, h2, started) => {
      if (!started) return;

      const c1 = world.getCollider(h1);
      const c2 = world.getCollider(h2);

      if (!c1 || !c2) return;

      const b1 = c1.parent();
      const b2 = c2.parent();

      if (!b1 || !b2) return;

      const v1 = b1.linvel();
      const v2 = b2.linvel();

      const dx = v1.x - v2.x;
      const dy = v1.y - v2.y;
      const dz = v1.z - v2.z;

      const impact = dx * dx + dy * dy + dz * dz;

      if (impact < 0.5) return;

      console.log("Collision");

      const pos1 = b1.translation();
      const pos2 = b2.translation();

      const impactPos = new THREE.Vector3(
        (pos1.x + pos2.x) * 0.5,
        (pos1.y + pos2.y) * 0.5,
        (pos1.z + pos2.z) * 0.5
      );

      const normal = new THREE.Vector3(
        dx,
        dy,
        dz
      ).normalize();

      this.onImpact?.(
        impactPos,
        normal,
        impact
      );

      const cargoA = this.cargoLookup.get(b1.handle);
      const cargoB = this.cargoLookup.get(b2.handle);

      const damage = impact * 2.0;

      if (cargoA) {
        cargoA.health.applyDamage(damage);
        cargoA.damageVisual.applyDamage(damage * 0.01);
      }

      if (cargoB) {
        cargoB.health.applyDamage(damage);
        cargoB.damageVisual.applyDamage(damage * 0.01);
      }
    });
  }
}