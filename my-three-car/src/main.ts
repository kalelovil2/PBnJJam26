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

// asteroids
const asteroids = createAsteroids();

// camera position (top-down-ish)
camera.position.set(0, 10, 10);

function createAsteroids()
{
  const asteroids: any[] = [];

  for (let i = 0; i < 25; i++) 
  {
    const radius = 0.5 + Math.random() * 2;

    const asteroid = createAsteroid(
      radius,
      0.10 + Math.random() * 0.04, // roughness
      2 + Math.random() * 2       // detail
    );

    asteroid.position.set(
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 100
    );

    scene.add(asteroid);

    asteroids.push({
      mesh: asteroid,

      rotationSpeed: {
        x: (Math.random() - 0.5) * 0.01,
        y: (Math.random() - 0.5) * 0.01,
        z: (Math.random() - 0.5) * 0.01
      },

      drift: new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.006,
        (Math.random() - 0.5) * 0.02
      )
    });
  }

  return asteroids;
}

function animate() {
  requestAnimationFrame(animate);

  car.update();

  // simple follow camera
  camera.position.x = car.mesh.position.x;
  camera.position.z = car.mesh.position.z + 10;
  camera.lookAt(car.mesh.position);

  renderer.render(scene, camera);

  for (const asteroid of asteroids) {
    asteroid.mesh.rotation.x += asteroid.rotationSpeed.x;
    asteroid.mesh.rotation.y += asteroid.rotationSpeed.y;
    asteroid.mesh.rotation.z += asteroid.rotationSpeed.z;

    asteroid.mesh.position.add(asteroid.drift);
  }
}

animate();

function createAsteroid(
  radius = 1,
  roughness = 0.15,
  detail = 2
) {
  const geometry = new THREE.SphereGeometry(radius, 128, 128);

  const pos = geometry.attributes.position;

  const vertex = new THREE.Vector3();

  // random axis stretching
const stretch = new THREE.Vector3(
  0.7 + Math.random() * 0.8,
  0.7 + Math.random() * 0.8,
  0.7 + Math.random() * 0.8
);

  for (let i = 0; i < pos.count; i++) {
    vertex.fromBufferAttribute(pos, i);

    // normalized direction
    const normal = vertex.clone().normalize();

    // smooth pseudo-noise
    const noise =
      Math.sin(normal.x * detail) *
      Math.sin(normal.y * detail) *
      Math.sin(normal.z * detail);

    // displacement
    const displacement = 1 + noise * roughness;

    vertex.copy(normal.multiplyScalar(radius * displacement));

    // re-apply stretch after displacement
vertex.x *= stretch.x;
vertex.y *= stretch.y;
vertex.z *= stretch.z;

    pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    map: createAsteroidTexture(),
    flatShading: true,
    roughness: 1
  });

  return new THREE.Mesh(geometry, material);
}

function createAsteroidTexture() {
  const size = 256;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#666";
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;

    const radius = Math.random() * 6;

    const brightness = 80 + Math.random() * 100;

    ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}