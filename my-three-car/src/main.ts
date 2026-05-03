import * as THREE from "three";

import { StartMenu } from "./StartMenu";
import { Ship } from "./engine/Ship.ts";
import { rand } from "three/tsl";
import RAPIER from "@dimforge/rapier3d";
import { getWorld, initPhysics, stepPhysics } from "./physics";
import { DebugOverlay } from "./engine/DebugOverlay";
import { AsteroidGenerator } from "./engine/AsteroidGenerator";
import { CheckpointGenerator } from "./engine/CheckpointGenerator.ts";
import { Cargo, CargoType } from "./engine/Cargo";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CargoGenerator } from "./engine/CargoGenerator.ts";

export const ASTEROID_FIELD_RADIUS = 100;
export const ASTEROID_SAFE_RADIUS = 15;
const ASTEROID_COUNT = 280;
const CARGO_COUNT = 30;
export const PLAYER_START = new THREE.Vector3(0, 0, -4);

const startMenu = new StartMenu();
await startMenu.show();

const scene = new THREE.Scene();

await initPhysics();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Debug Display
const debugOverlay = new DebugOverlay();

// light
const light = new THREE.DirectionalLight(0xffffff, 0.7);
light.position.set(5, 10, 5);
scene.add(light);
const ambient = new THREE.AmbientLight(0xffffff, 0.01);
scene.add(ambient);

// ship
const ship = new Ship(scene, PLAYER_START);
const startingCargo = new Cargo(scene, new THREE.Vector3(0, 0, 2.5), CargoType.SAFE);
const joint = RAPIER.JointData.spring(
  0.25,   // rest length (distance between ship and cargo)
  80.0,  // stiffness (higher = tighter connection)
  80.0,   // damping (higher = less swing / jackknife)
  new RAPIER.Vector3(0, 0, 1.5),
  new RAPIER.Vector3(0, 0, -1)
);
getWorld().createImpulseJoint(joint, ship.body, startingCargo.body, true);

const cargoChain: Cargo[] = [startingCargo];
const anchorA = new RAPIER.Vector3(0, 0, -1);
const anchorB = new RAPIER.Vector3(0, 0, 1);
const stiffness = Math.max(80 - cargoChain.length * 3, 30);

// asteroids
const asteroids = AsteroidGenerator.createAsteroids(scene, ASTEROID_COUNT);

// checkpoints
const checkpoints =
  await CheckpointGenerator.spawnCheckpoints(
    scene,
    getWorld(),
    asteroids,
    10,   // number of checkpoints
    100   // level radius
  );

// Random cargo
const randomCargo =
  CargoGenerator.spawnCargo(
    scene,
    asteroids,
    checkpoints,
    CARGO_COUNT,
    ASTEROID_FIELD_RADIUS
  );

// camera position (top-down-ish)
camera.position.set(0, 10, 10);

animate();

const listener = new THREE.AudioListener();
camera.add(listener);
// create a global audio source
const sound = new THREE.Audio(listener);
// load a sound and set it as the Audio object's buffer
const audioLoader = new THREE.AudioLoader();
audioLoader.load('./ambient.ogg', function (buffer) {
  sound.setBuffer(buffer);
  sound.setLoop(true);
  sound.setVolume(0.4);
  sound.play();
});

function animate() {
  // APPLY INPUT / FORCES ONLY
  ship.updateControls();

  stepPhysics();

  // READ PHYSICS STATE AFTER STEP
  ship.syncFromPhysics();
  startingCargo.sync();

  for (const cargo of randomCargo) {
    cargo.sync();
  }

  checkCargoPickup();

  for (const asteroid of asteroids) {
    asteroid.update();
  }

  debugOverlay.update(ship.mesh, ship.visual);

  renderer.render(scene, camera);

  ship.updateCamera(camera);

  requestAnimationFrame(animate);
}

function onLoadedPlayerModel(value: any): ((value: import("three/examples/jsm/loaders/GLTFLoader.js").GLTF) => import("three/examples/jsm/loaders/GLTFLoader.js").GLTF | PromiseLike<import("three/examples/jsm/loaders/GLTFLoader.js").GLTF>) | null | undefined {
  throw new Error("Function not implemented.");
}

function checkCargoPickup() {
  const last = cargoChain[cargoChain.length - 1];

  const lastPos = last.body.translation();

  for (let i = randomCargo.length - 1; i >= 0; i--) {
    const cargo = randomCargo[i];
    const pos = cargo.body.translation();

    const dx = pos.x - lastPos.x;
    const dy = pos.y - lastPos.y;
    const dz = pos.z - lastPos.z;

    const dist2 = dx * dx + dy * dy + dz * dz;

    THREE.log("TRY ATTACH");
    if (dist2 < 5.0) {
      attachCargo(cargo);
      randomCargo.splice(i, 1);
    }
  }
}

function attachCargo(cargo: Cargo) {
  THREE.log("ATTACH");
  const last = cargoChain[cargoChain.length - 1];

  const joint = RAPIER.JointData.spring(
    0.25,
    80.0,
    80.0,
    new RAPIER.Vector3(0, 0, 1.5),
    new RAPIER.Vector3(0, 0, -1)
  );

  getWorld().createImpulseJoint(
    joint,
    last.body,
    cargo.body,
    true
  );

  cargoChain.push(cargo);
}
