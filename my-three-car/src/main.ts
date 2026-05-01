import * as THREE from "three";

import { Car } from "./engine/Car";
import { rand } from "three/tsl";

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

// Asteroid
const asteroid = new THREE.Mesh(
  new THREE.SphereGeometry(2, 24, 24),
  new THREE.MeshStandardMaterial({
    map: createAsteroidTexture()
  }),
);
scene.add(asteroid);
asteroid.position.set(3, 0, -5);

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

  asteroid.rotation.x += 0.005;
  asteroid.rotation.y += 0.01;
  asteroid.position.x += 0.0025;
}

animate();



function createAsteroidTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d")!;

  // base color
  ctx.fillStyle = "#777777";
  ctx.fillRect(0, 0, size, size);

  // add noise blobs
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 3;

    const shade = 100 + Math.random() * 80;
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  return texture;
}