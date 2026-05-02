import * as THREE from "three";
import { DEBUG } from "../config";

export class DebugOverlay {
  element: HTMLDivElement;

  fps = 0;

  private frames = 0;
  private lastFpsUpdate = performance.now();
  private fpsSamples: number[] = [];
  private medianLowFps = 0;

  private startTime = performance.now();

  constructor() {
    this.element = document.createElement("div");

    this.element.style.position = "fixed";
    this.element.style.top = "10px";
    this.element.style.right = "10px";
    this.element.style.padding = "10px";
    this.element.style.background = "rgba(0,0,0,0.7)";
    this.element.style.color = "white";
    this.element.style.fontFamily = "monospace";
    this.element.style.fontSize = "12px";
    this.element.style.whiteSpace = "pre";
    this.element.style.pointerEvents = "none";
    this.element.style.zIndex = "9999";

    document.body.appendChild(this.element);
  }

  update(ship: THREE.Object3D, visual: THREE.Object3D) {
    if (!DEBUG) return;

    // FPS
    this.frames++;

    const now = performance.now();

    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frames;
      this.frames = 0;
      this.lastFpsUpdate = now;
    }

    this.fpsSamples.push(this.fps);

    if (this.fpsSamples.length > 120) {
    this.fpsSamples.shift();
    }

    // 1% low-ish approximation
    const sorted = [...this.fpsSamples].sort((a, b) => a - b);

    const lowIndex = Math.floor(sorted.length * 0.1);

    this.medianLowFps = sorted[lowIndex] || this.fps;

    // Elapsed Time
    const elapsedSeconds = (performance.now() - this.startTime) / 1000;

    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = Math.floor(elapsedSeconds % 60);

    const gameTime =
    `${minutes.toString().padStart(2, "0")}:` +
    `${seconds.toString().padStart(2, "0")}`;

    // Position
    const pos = ship.position;

    // Rotation
    const rot = new THREE.Euler().setFromQuaternion(
      ship.quaternion,
      "YXZ"
    );

    // Visual Rotation
    const visualRot = new THREE.Euler().setFromQuaternion(
        visual!.quaternion,
        "YXZ"
    );

    // Memory
    let memoryText = "N/A";

    const perfAny = performance as any;

    if (perfAny.memory) {
      const used =
        perfAny.memory.usedJSHeapSize / 1024 / 1024;

      const total =
        perfAny.memory.totalJSHeapSize / 1024 / 1024;

      memoryText =
        `${used.toFixed(1)} MB / ${total.toFixed(1)} MB`;
    }

    this.element.textContent =
`SHIP POSITION
x: ${pos.x.toFixed(2)}
y: ${pos.y.toFixed(2)}
z: ${pos.z.toFixed(2)}

SHIP ROTATION
x: ${(Math.abs(THREE.MathUtils.radToDeg(rot.x)) < 0.05 ? 0 : THREE.MathUtils.radToDeg(rot.x)).toFixed(1)}
y: ${(Math.abs(THREE.MathUtils.radToDeg(rot.y)) < 0.05 ? 0 : THREE.MathUtils.radToDeg(rot.y)).toFixed(1)}
z: ${(Math.abs(THREE.MathUtils.radToDeg(rot.z)) < 0.05 ? 0 : THREE.MathUtils.radToDeg(rot.z)).toFixed(1)}

SHIP VISUAL ROTATION
x: ${(Math.abs(THREE.MathUtils.radToDeg(visualRot.x)) < 0.05 ? 0 : THREE.MathUtils.radToDeg(visualRot.x)).toFixed(1)}
y: ${(Math.abs(THREE.MathUtils.radToDeg(visualRot.y)) < 0.05 ? 0 : THREE.MathUtils.radToDeg(visualRot.y)).toFixed(1)}
z: ${(Math.abs(THREE.MathUtils.radToDeg(visualRot.z)) < 0.05 ? 0 : THREE.MathUtils.radToDeg(visualRot.z)).toFixed(1)}

GAME TIME
${gameTime}

FPS CURRENT / MEDIAN LOW
${this.fps.toFixed(1)} / ${this.medianLowFps.toFixed(1)}

FRAME TIME
${(1000 / this.fps).toFixed(2)} ms

MEMORY:
${memoryText}`;
  }
}