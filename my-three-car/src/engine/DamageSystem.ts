import { world, eventQueue } from "../physics";
import RAPIER from "@dimforge/rapier3d";
import { Cargo } from "./Cargo";

export class DamageSystem {
  cargoLookup = new Map<number, Cargo>();

  registerCargo(cargo: Cargo) {
    this.cargoLookup.set(cargo.collider.handle, cargo);
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

  const impact = dx*dx + dy*dy + dz*dz;
});
  }
}