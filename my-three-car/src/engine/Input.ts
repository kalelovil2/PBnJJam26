export class Input {
  keys: Record<string, boolean> = {};

  constructor() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  get forward() {
    return this.keys["w"];
  }

  get back() {
    return this.keys["s"];
  }

  get left() {
    return this.keys["a"];
  }

  get right() {
    return this.keys["d"];
  }
}