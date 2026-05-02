import * as THREE from "three";

import { Car } from "./engine/Car";
import { rand } from "three/tsl";
import RAPIER from "@dimforge/rapier3d-compat";
import { getWorld, initPhysics, stepPhysics } from "./physics";
import { DebugOverlay } from "./engine/DebugOverlay";
import { AsteroidGenerator } from "./engine/AsteroidGenerator";

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

// car
const car = new Car(scene);

// add a front indicator
const nose = new THREE.Mesh(
  new THREE.SphereGeometry(0.3, 8, 8),
  new THREE.MeshStandardMaterial({ color: 0xeedc5b })
);
// position it at the front of the ship (-Z in local space)
nose.position.set(0, 0, -1.2);
// point it forward
nose.rotation.x = Math.PI / 2;
car.mesh.add(nose);

const engine = new THREE.Mesh(
  new THREE.ConeGeometry(0.2, 0.6, 8),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
// position it at the front of the ship (-Z in local space)
engine.position.set(0, 0, 1.2);
// point it backwards (towards +Z)
engine.rotation.y = Math.PI;
// align cone so it "points out" properly
engine.rotation.x = -Math.PI / 2;
car.mesh.add(engine);

// asteroids
const asteroidGenerator = new AsteroidGenerator(scene);
const asteroids = asteroidGenerator.createAsteroids(96);

// camera position (top-down-ish)
camera.position.set(0, 10, 10);

animate();

function animate() {
  requestAnimationFrame(animate);

  car.update();

  camera.position.x = car.mesh.position.x;
  camera.position.z = car.mesh.position.z + 10;
  camera.lookAt(car.mesh.position);

  stepPhysics();

  for (const a of asteroids) {
    a.syncFromPhysics();
  }

  debugOverlay.update(car.mesh, car.visual);

  renderer.render(scene, camera);
}