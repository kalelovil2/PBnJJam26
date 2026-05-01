import Phaser from "phaser";

export class MainScene extends Phaser.Scene {
  car!: Phaser.GameObjects.Rectangle;

  constructor() {
    super("MainScene");
  }

  create() {
    this.car = this.add.rectangle(400, 300, 80, 50, 0x00ff00);
    this.physics.add.existing(this.car);
    this.physics.world.gravity.y = 0;

    const body = this.car.body as Phaser.Physics.Arcade.Body;
body.setCollideWorldBounds(true);



  }

  update() {
    const body = this.car.body as Phaser.Physics.Arcade.Body;

const keys = this.input.keyboard!.addKeys("W,A,S,D") as any;

const speed = 200;

body.setVelocity(0);

if (keys.W.isDown) body.setVelocityY(-speed);
if (keys.S.isDown) body.setVelocityY(speed);
if (keys.A.isDown) body.setVelocityX(-speed);
if (keys.D.isDown) body.setVelocityX(speed);
  }
}