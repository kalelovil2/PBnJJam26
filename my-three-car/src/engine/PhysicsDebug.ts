import * as THREE from "three";

type DebugJointLine = {
  line: THREE.Line;
  a: any; // RigidBody
  b: any; // RigidBody
};

export class PhysicsDebug {
  private scene: THREE.Scene;
  private lines: DebugJointLine[] = [];
  private enabled = true;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "j") {
        this.enabled = !this.enabled;
        this.setVisible(this.enabled);
      }
    });
  }

  private setVisible(v: boolean) {
    this.lines.forEach(l => l.line.visible = v);
  }

  // call this when you create a cargo joint
  addJoint(aBody: any, bBody: any) {
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.8,
    });

    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(),
    ]);

    const line = new THREE.Line(geometry, material);
    this.scene.add(line);

    this.lines.push({ line, a: aBody, b: bBody });
  }

  update() {
    if (!this.enabled) return;

    for (const l of this.lines) {
      const a = l.a.translation();
      const b = l.b.translation();

      const p1 = new THREE.Vector3(a.x, a.y, a.z);
      const p2 = new THREE.Vector3(b.x, b.y, b.z);

      (l.line.geometry as THREE.BufferGeometry).setFromPoints([p1, p2]);
    }
  }
}