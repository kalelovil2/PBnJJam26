import * as THREE from "three";

import { Car } from "./engine/Car";

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);

// car
const car = new Car(scene);

// camera position (top-down-ish)
camera.position.set(0, 10, 10);

function animate() {
  requestAnimationFrame(animate);

  car.update();

  // simple follow camera
  camera.position.x = car.mesh.position.x;
  camera.position.z = car.mesh.position.z + 10;
  camera.lookAt(car.mesh.position);

  renderer.render(scene, camera);
}

animate();