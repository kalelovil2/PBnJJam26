import * as THREE from "three";
import { ImpactParticleSystem } from "./engine/ImpactParticleSystem";

import { StartMenu } from "./StartMenu";
import { CargoTetherRenderer } from "./engine/Cargo/CargoTetherRenderer.ts";

import { getWorld, initPhysics, stepPhysics } from "./physics";

import { DebugOverlay } from "./engine/DebugOverlay";;
import { CometField } from "./engine/SpaceObjects/CometField.ts";

import {
  Cargo,
  CargoType
} from "./engine/Cargo/Cargo";

import { CargoGenerator } from "./engine/Cargo/CargoGenerator.ts";
import { PhysicsDebug } from "./engine/PhysicsDebug.ts";
import { DamageSystem } from "./engine/DamageSystem.ts";
  import { ShipHeadlightSystem } from "./engine/Ship/ShipHeadlightSystem.ts";
import { ASTEROID_COUNT, CARGO_COUNT, CHECKPOINT_COUNT, COMET_COUNT, LEVEL_SIZE, PLAYER_START } from "./GameConfig.ts";
import { Ship } from "./engine/Ship/Ship.ts";
import { CheckpointGenerator } from "./engine/Checkpoints/CheckpointGenerator.ts";
import { AsteroidGenerator } from "./engine/SpaceObjects/AsteroidGenerator.ts";

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
    0.575
  );

light.position.set(5, 10, 5);

scene.add(light);

const fillLight = new THREE.HemisphereLight(
  0x4466ff,   // sky
  0x221122,   // ground
  0.2
);

scene.add(fillLight);

const ambient =
  new THREE.AmbientLight(
    0xffffff,
    0.0125
  );

scene.add(ambient);

scene.fog = new THREE.FogExp2(0x0b0f14, 0.0125);

//
// SHIP
//

const ship =
  new Ship(scene, PLAYER_START);

const headlight = new ShipHeadlightSystem(ship, scene);

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

const damageSystem = new DamageSystem();

damageSystem.registerCargo(startingCargo1);
damageSystem.registerCargo(startingCargo2);

for (const c of levelCargo) {
  damageSystem.registerCargo(c);
}

const impactParticles =
  new ImpactParticleSystem(scene);

damageSystem.onImpact = (
  position,
  normal,
  strength
) => {
  impactParticles.spawnImpact(
    position,
    normal,
    strength
  );
};

//
// ASTEROIDS
//

const asteroids =
  AsteroidGenerator.createAsteroids(
    scene,
  );

  const cometField = new CometField(scene, COMET_COUNT);
//
// CHECKPOINTS
//

const checkpoints =
  await CheckpointGenerator.spawnCheckpoints(
    scene,
    getWorld(),
    asteroids
  );

//
// RANDOM CARGO
//

const spawnedCargo =
  CargoGenerator.spawnCargo(
    scene,
    asteroids,
    checkpoints
  );

levelCargo.push(...spawnedCargo);

//
// ADD STARTING CARGO
//

levelCargo.push(startingCargo1);
levelCargo.push(startingCargo2);

damageSystem.registerCargo(startingCargo1);
damageSystem.registerCargo(startingCargo2);

for (const c of levelCargo) {
  damageSystem.registerCargo(c);
}

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

  damageSystem.update();

  //
  // SYNC SHIP
  //

  ship.syncFromPhysics();

  headlight.update();

  //
  // SYNC CARGO
  //

  for (const cargo of levelCargo) {
    cargo.sync();
  }

  tetherRenderer.update(ship, cargoChain);

  impactParticles.update(1 / 60);

  //
  // ASTEROIDS
  //

  for (const asteroid of asteroids) {
    asteroid.update();
  }

  cometField.update(ship.mesh.position);

  //
  // DEBUG
  //

const vel = ship.body.linvel();
const angVel = ship.body.angvel();

debugOverlay.update(
  ship.mesh,
  ship.visual,
  new THREE.Vector3(
    vel.x,
    vel.y,
    vel.z
  ),
  new THREE.Vector3(
    angVel.x,
    angVel.y,
    angVel.z
  )
);

  for (const cargo of levelCargo) {
    cargo.updateDebugLabel(camera);
  }

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

window.addEventListener("keydown", (e) => {
  if (e.key === "h") {
    console.log("DEBUG HIT TEST");

    const firstCargo = cargoChain[0];
    const pos = firstCargo.mesh.position;
    if (!firstCargo) return;

    const damage = 25;
    const impactPos = new THREE.Vector3(
      pos.x,
      pos.y,
      pos.z
    );
    firstCargo.health.applyDamage(damage);
    firstCargo.damageVisual.applyMeshDent(
      impactPos,
      impactPos,
      damage
    );
    console.log("Cargo HP:", firstCargo.health.hp);
  }
});

window.addEventListener("keydown", (e) => {

  if (e.key === "p") {
    console.log("DEBUG HIT PARTICLES BURST");

    const firstCargo = cargoChain[0];
    if (!firstCargo) return;

    const pos = firstCargo.mesh.position.clone();

    impactParticles.spawnImpact(
      pos,
      new THREE.Vector3(0.5, 0, 1),
      100
    );

    console.log("DEBUG PARTICLES");
  }
});

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