import * as THREE from "three";

export class ScannerVisuals {

  private noiseCanvas: HTMLCanvasElement;
  private noiseData: ImageData;

  constructor() {
    this.noiseCanvas = document.createElement("canvas");
    this.noiseCanvas.width = 64;
    this.noiseCanvas.height = 256;

    const ctx = this.noiseCanvas.getContext("2d")!;
    this.noiseData = ctx.createImageData(
      this.noiseCanvas.width,
      this.noiseCanvas.height
    );
  }

  createBeamTexture(): THREE.CanvasTexture {

    const width = 256;
    const height = 64;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d")!;

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // build subtle noise field once per texture
    this.fillNoise();

    for (let y = 0; y < height; y++) {

      const v = y / height; // 0 → 1 along beam length

      // ---- length fade ONLY in caps ----
      let endFade = 1.0;

      const cap = 0.08; // ~first/last 1 unit visually

      // ONLY fade at the end
 if (v > 1.0 - cap) {
  endFade = (1.0 - v) / cap;
}

      // smooth it
      endFade = endFade * endFade * (3.0 - 2.0 * endFade);

      for (let x = 0; x < width; x++) {

        const u = x / width;

        // ---- side fade ----
        let sideFade =
          1.0 - Math.abs(u - 0.5) * 2.0;

        sideFade = Math.max(0, sideFade);
        sideFade = sideFade * sideFade;

        // ---- subtle alpha noise breakup ----
        const noiseIndex =
          ((y * this.noiseCanvas.width + (x % this.noiseCanvas.width)) * 4);

        const noise =
          this.noiseData.data[noiseIndex] / 255;

        const noiseFactor =
          0.85 + noise * 0.3;

        // ---- final alpha ----
        let alpha =
          sideFade *
          endFade *
          noiseFactor;

        const i = (y * width + x) * 4;

        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = alpha * 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);

    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    texture.needsUpdate = true;

    return texture;
  }

  private fillNoise() {
    const ctx = this.noiseCanvas.getContext("2d")!;

    const img = this.noiseData;
    const d = img.data;

    for (let i = 0; i < d.length; i += 4) {

      // soft white noise (not harsh static)
      const v = 0.5 + Math.random() * 0.5;

      d[i] = v * 255;
      d[i + 1] = v * 255;
      d[i + 2] = v * 255;
      d[i + 3] = 255;
    }

    ctx.putImageData(img, 0, 0);
  }
}