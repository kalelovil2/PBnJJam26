import RAPIER from "@dimforge/rapier3d";

let world: RAPIER.World;

let gravity = { x: 0, y: 0, z: 0 };

let stepping = false;

export async function initPhysics() {
  
  world = new RAPIER.World(gravity);

  return world;
}

export function stepPhysics() {
  if (stepping) return;

  stepping = true;

  world.step();

  stepping = false;
}

export function getWorld() {
  return world;
}