import RAPIER from "@dimforge/rapier3d-compat";

let world: RAPIER.World;
let gravity = { x: 0, y: 0, z: 0 }; // space game → no gravity

export async function initPhysics() {
  await RAPIER.init();

  world = new RAPIER.World(gravity);

  return world;
}

export function stepPhysics() {
  world.step();
}

export function getWorld() {
  return world;
}