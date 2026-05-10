import * as THREE from "three";

import { StartMenu } from "./StartMenu";
import { Ship } from "./engine/Ship.ts";
import { CargoTetherRenderer } from "./engine/CargoTetherRenderer";
import RAPIER from "@dimforge/rapier3d";

import { getWorld, initPhysics, stepPhysics } from "./physics";

import { DebugOverlay } from "./engine/DebugOverlay";
import { AsteroidGenerator } from "./engine/AsteroidGenerator";
import { CheckpointGenerator } from "./engine/CheckpointGenerator.ts";

import {
  Cargo,
  CargoType
} from "./engine/Cargo";

import { CargoGenerator } from "./engine/CargoGenerator.ts";
import { PhysicsDebug } from "./engine/PhysicsDebug.ts";

export const ASTEROID_FIELD_RADIUS = 100;
export const ASTEROID_SAFE_RADIUS = 15;

const ASTEROID_COUNT = 280;
const CARGO_COUNT = 30;

export const PLAYER_START =
  new THREE.Vector3(0, 0, -4);

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

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);
renderer.setPixelRatio(window.devicePixelRatio);

document.body.appendChild(renderer.domElement);

//
// DEBUG
//

const debugOverlay = new DebugOverlay();

//
// LIGHTING
//

const light =
  new THREE.DirectionalLight(
    0xffffff,
    0.7
  );

light.position.set(5, 10, 5);

scene.add(light);

const ambient =
  new THREE.AmbientLight(
    0xffffff,
    0.01
  );

scene.add(ambient);

//
// SHIP
//

const ship =
  new Ship(scene, PLAYER_START);

//
// STARTING CARGO
//

const startingCargo1 =
  new Cargo(
    scene,
    new THREE.Vector3(0, 0, 2.5),
    CargoType.SAFE
  );

const startingCargo2 =
  new Cargo(
    scene,
    new THREE.Vector3(0, 0, 9.0),
    CargoType.SAFE
  );

//
// ALL CARGO
//

const levelCargo: Cargo[] = [];

//
// TRAILER CHAIN
//

const cargoChain: Cargo[] = [];

const tetherRenderer = new CargoTetherRenderer(scene);

//
// ASTEROIDS
//

const asteroids =
  AsteroidGenerator.createAsteroids(
    scene,
    ASTEROID_COUNT
  );

//
// CHECKPOINTS
//

const checkpoints =
  await CheckpointGenerator.spawnCheckpoints(
    scene,
    getWorld(),
    asteroids,
    10,
    100
  );

//
// RANDOM CARGO
//

const spawnedCargo =
  CargoGenerator.spawnCargo(
    scene,
    asteroids,
    checkpoints,
    CARGO_COUNT,
    ASTEROID_FIELD_RADIUS
  );

levelCargo.push(...spawnedCargo);

//
// ADD STARTING CARGO
//

levelCargo.push(startingCargo1);
levelCargo.push(startingCargo2);

//
// INITIALIZE TRAILER CHAIN
//

// startingCargo1.attached = true;
// startingCargo1.followTarget = ship;

// startingCargo2.attached = true;
// startingCargo2.followTarget = startingCargo1;

// trailerChain.push(startingCargo1);
// trailerChain.push(startingCargo2);

//
// CAMERA
//

camera.position.set(0, 10, 10);

//
// AUDIO
//

const listener =
  new THREE.AudioListener();

camera.add(listener);

const sound =
  new THREE.Audio(listener);

const audioLoader =
  new THREE.AudioLoader();

audioLoader.load(
  "./ambient.ogg",
  function (buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.4);
    sound.play();
  }
);

const debug = new PhysicsDebug(scene);

//
// PICKUP LOGIC
//

function logTrailerChain(label: string, chain: any[]) {
  console.group(`🚚 TrailerChain: ${label}`);

  chain.forEach((t, i) => {
    console.log(i, {
      type: t?.constructor?.name,
      hasBody: !!t?.body,
      attached: t?.attached,
      isCapturing: t?.isCapturing,
      followTargetType: t?.followTarget?.constructor?.name,
    });
  });

  console.groupEnd();
}

function tryAttachCargo() {

  if (!ship?.body) {
    console.error("Ship not ready");
    return;
  }

  const collectors = [
    ship,
    ...cargoChain
  ];

  for (const cargo of levelCargo) {
    //
    // skip attached cargo
    //

    if (cargo.attached || cargo.isCapturing) {
      continue;
    }

    const cargoPos =
      cargo.body.translation();

    let distSq = Infinity;
    let nearestCollector: any = null;

    for (const collector of collectors) {

      const collectorPos =
        collector.body.translation();

      const dx =
        cargoPos.x - collectorPos.x;

      const dy =
        cargoPos.y - collectorPos.y;

      const dz =
        cargoPos.z - collectorPos.z;

      const d =
        dx * dx +
        dy * dy +
        dz * dz;

      const pickupRadius =
        collector === ship
          ? 6.0   // bigger radius for ship
          : 4.0;  // normal cargo radius

      if (d < pickupRadius) {
        distSq = d;
        nearestCollector = collector;
      }
    }

    //
    // pickup radius
    //

    if (nearestCollector) {

      logTrailerChain("before attach", cargoChain);

      console.log("RAW TRAILER ARRAY:", cargoChain);
      console.log("LAST ELEMENT:", cargoChain[cargoChain.length - 1]);

      const previousTrailer =
  cargoChain.length > 0
    ? cargoChain[cargoChain.length - 1]
    : ship;

      cargo.attached = true;

      console.log("previousTrailer:", previousTrailer);
      console.log("has body:", previousTrailer?.body);

      cargo.followTarget =
        previousTrailer;

      cargo.isCapturing = true;

      cargo.captureTimer = 0.8;

      cargo.collider.setCollisionGroups(0);

      const parentVel =
        previousTrailer.body.linvel();

      cargo.body.setLinvel(
        {
          x: parentVel.x,
          y: parentVel.y,
          z: parentVel.z
        },
        true
      );

      //
      // remove existing velocity
      //

      const pos = cargo.body.translation();

      cargo.followPosition.set(
        pos.x,
        pos.y,
        pos.z
      );

      cargoChain.push(cargo);

      debug.addJoint(previousTrailer.body, cargo.body);

      logTrailerChain("after attach", cargoChain);

      break;
    }
  }
}

//
// MAIN LOOP
//

function animate() {
  requestAnimationFrame(animate);

  //
  // PLAYER INPUT
  //

  ship.updateControls();

  //
  // PICKUPS
  //

  tryAttachCargo();

  //
  // TRAILER FOLLOWING
  //

  for (const cargo of cargoChain) {
    cargo.updateCapture(1 / 60);
    cargo.updateAttachedMotion();
  }

  //
  // PHYSICS STEP
  //

  stepPhysics();

  //
  // SYNC SHIP
  //

  ship.syncFromPhysics();

  //
  // SYNC CARGO
  //

  for (const cargo of levelCargo) {
    cargo.sync();
  }

  tetherRenderer.update(ship, cargoChain);

  //
  // ASTEROIDS
  //

  for (const asteroid of asteroids) {
    asteroid.update();
  }

  //
  // DEBUG
  //

  debugOverlay.update(
    ship.mesh,
    ship.visual
  );

  //
  // CAMERA
  //

  ship.updateCamera(camera);

  //
  // RENDER
  //

  renderer.render(scene, camera);
}

animate();

//
// RESIZE
//

window.addEventListener(
  "resize",
  () => {
    camera.aspect =
      window.innerWidth /
      window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );
  }
);