import RAPIER from "@dimforge/rapier3d";

export let world: RAPIER.World;
export let eventQueue: RAPIER.EventQueue;

let gravity = { x: 0, y: 0, z: 0 };

let stepping = false;

export async function initPhysics() {
  
  world = new RAPIER.World(gravity);
  
  eventQueue = new RAPIER.EventQueue(true);

  return world;
}

export function stepPhysics() {
  if (stepping) return;

  stepping = true;

  world.step(eventQueue);

  stepping = false;
}

export function getWorld() {
  return world;
}