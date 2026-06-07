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

  // -------------------------
  // BODY
  // -------------------------

  createBodyMaterial(): THREE.Material {
    return new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      emissive: 0x224466,
      emissiveIntensity: 1
    });
  }

  // -------------------------
  // BEAM
  // -------------------------

  createBeamTexture(): THREE.CanvasTexture {
    const width = 256;
    const height = 64;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    this.fillNoise();

    for (let y = 0; y < height; y++) {
      const v = y / height;

      let endFade = 1.0;
      const cap = 0.08;

      // ONLY fade at end
      if (v > 1.0 - cap) {
        endFade = (1.0 - v) / cap;
      }

      endFade = endFade * endFade * (3.0 - 2.0 * endFade);

      for (let x = 0; x < width; x++) {
        const u = x / width;

        let sideFade = 1.0 - Math.abs(u - 0.5) * 2.0;
        sideFade = Math.max(0, sideFade);
        sideFade = sideFade * sideFade;

        const noiseIndex =
          ((y * this.noiseCanvas.width + (x % this.noiseCanvas.width)) * 4);

        const noise = this.noiseData.data[noiseIndex] / 255;
        const noiseFactor = 0.85 + noise * 0.3;

        const alpha = sideFade * endFade * noiseFactor;

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

  createBeamMaterial(texture: THREE.Texture): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
      color: 0x77ccff,
      map: texture,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
  }

  createBeamGeometry(width: number, radius: number): THREE.PlaneGeometry {
    return new THREE.PlaneGeometry(width, radius);
  }

  createBeamPlanes(
    geometry: THREE.PlaneGeometry,
    material: THREE.Material
  ) {
    const beamA = new THREE.Mesh(geometry, material);
    const beamB = new THREE.Mesh(geometry, material);

    beamA.rotation.x = -Math.PI / 2;
    beamB.rotation.set(-Math.PI / 2, Math.PI / 2, 0);

    return { a: beamA, b: beamB };
  }

  positionBeam(mesh: THREE.Mesh, radius: number) {
    mesh.position.z = radius * 0.5;
  }

  // -------------------------
  // CORE
  // -------------------------

  createCoreMaterial(): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
      color: 0x99ddff,
      transparent: true,
      opacity: 0.05,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }

  createCoreGeometry(radius: number): THREE.CylinderGeometry {
    return new THREE.CylinderGeometry(0.95, 0.25, radius, 8);
  }

  createCoreMesh(
    geometry: THREE.CylinderGeometry,
    material: THREE.Material
  ): THREE.Mesh {
    return new THREE.Mesh(geometry, material);
  }

  positionCore(core: THREE.Mesh, radius: number) {
    core.rotation.x = Math.PI / 2;
    core.position.z = radius * 0.5;
  }

  // -------------------------
  // RING
  // -------------------------

  createRing(): THREE.Mesh {
    return new THREE.Mesh(
      new THREE.RingGeometry(0.025, 0.25, 32),
      new THREE.MeshBasicMaterial({
        color: 0x66ccff,
        transparent: true,
        opacity: 0.05,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
  }

  positionRing(ring: THREE.Mesh, cylinderRadius: number) {
    ring.rotation.z = Math.PI / 2;
    ring.position.z = cylinderRadius;
  }

  // -------------------------
  // NOISE
  // -------------------------

  private fillNoise() {
    const ctx = this.noiseCanvas.getContext("2d")!;
    const img = this.noiseData;
    const d = img.data;

    for (let i = 0; i < d.length; i += 4) {
      const v = 0.5 + Math.random() * 0.5;

      d[i] = v * 255;
      d[i + 1] = v * 255;
      d[i + 2] = v * 255;
      d[i + 3] = 255;
    }

    ctx.putImageData(img, 0, 0);
  }
}