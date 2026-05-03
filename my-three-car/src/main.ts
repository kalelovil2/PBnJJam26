import * as THREE from "three";

import { Ship } from "./engine/Ship.ts";
import { rand } from "three/tsl";
import RAPIER from "@dimforge/rapier3d-compat";
import { getWorld, initPhysics, stepPhysics } from "./physics";
import { DebugOverlay } from "./engine/DebugOverlay";
import { AsteroidGenerator } from "./engine/AsteroidGenerator";
import { CheckpointGenerator } from "./engine/CheckpointGenerator.ts";
import { Cargo } from "./engine/Cargo";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

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
const ship = new Ship(scene, new THREE.Vector3(0, 0, -4));
const cargo = new Cargo(scene, new THREE.Vector3(0, 0, 2.5));
const joint = RAPIER.JointData.spring(
  0.25,   // rest length (distance between ship and cargo)
  80.0,  // stiffness (higher = tighter connection)
  80.0,   // damping (higher = less swing / jackknife)
  new RAPIER.Vector3(0, 0, 1.5),
  new RAPIER.Vector3(0, 0, -1)
);

getWorld().createImpulseJoint(joint, ship.body, cargo.body, true);

// add a front indicator
// const nose = new THREE.Mesh(
//   new THREE.SphereGeometry(0.3, 8, 8),
//   new THREE.MeshStandardMaterial({ color: 0xeedc5b })
// );
// // position it at the front of the ship (-Z in local space)
// nose.position.set(0, 0, -1.2);
// // point it forward
// nose.rotation.x = Math.PI / 2;
// ship.mesh.add(nose);

// const engine = new THREE.Mesh(
//   new THREE.ConeGeometry(0.2, 0.6, 8),
//   new THREE.MeshStandardMaterial({ color: 0xff0000 })
// );
// position it at the front of the ship (-Z in local space)
// engine.position.set(0, 0, 1.2);
// // point it backwards (towards +Z)
// engine.rotation.y = Math.PI;
// // align cone so it "points out" properly
// engine.rotation.x = -Math.PI / 2;
// ship.mesh.add(engine);

// asteroids
const asteroidGenerator = new AsteroidGenerator(scene);
const asteroids = asteroidGenerator.createAsteroids(160);

// checkpoints
const checkpoints =
  await CheckpointGenerator.spawnCheckpoints(
    scene,
    getWorld(),
    10,   // number of checkpoints
    100   // level radius
  );

// camera position (top-down-ish)
camera.position.set(0, 10, 10);

animate();

function animate() {
  requestAnimationFrame(animate);

  ship.update();
  cargo.sync();

  stepPhysics();

  for (const asteroid of asteroids) 
  {
    asteroid.update();
  }

  debugOverlay.update(ship.mesh, ship.visual);

  renderer.render(scene, camera);

  ship.updateCamera(camera);
}

function onLoadedPlayerModel(value: any): ((value: import("three/examples/jsm/loaders/GLTFLoader.js").GLTF) => import("three/examples/jsm/loaders/GLTFLoader.js").GLTF | PromiseLike<import("three/examples/jsm/loaders/GLTFLoader.js").GLTF>) | null | undefined {
  throw new Error("Function not implemented.");
}
