const input = new Input();
const world = new World(scene);
const car = new Car(scene, input);
const cameraController = new GameCamera(camera);

function animate() {
  requestAnimationFrame(animate);

  car.update();
  world.update();

  cameraController.update(car.mesh.position);

  renderer.render(scene, camera);
}