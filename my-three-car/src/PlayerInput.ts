import * as THREE from "three";

export class PlayerInput {
    mouse = new THREE.Vector2(0, 0);
    mouseDown = false;

    // final output used by Ship
    steering = new THREE.Vector2(0, 0);

    throttle = 0;

    private raycaster = new THREE.Raycaster();

    constructor() {
        window.addEventListener("mousemove", (e) => {
            this.mouse.set(
                (e.clientX / window.innerWidth) * 2 - 1,
                -(e.clientY / window.innerHeight) * 2 + 1
            );
        });

        window.addEventListener("mousedown", () => {
            this.mouseDown = true;
        });

        window.addEventListener("mouseup", () => {
            this.mouseDown = false;
            this.steering.set(0, 0);
            this.throttle = 0;
        });

        window.addEventListener("touchstart", (e) => this.onTouch(e));
        window.addEventListener("touchmove", (e) => this.onTouch(e));
        window.addEventListener("touchend", () => {
            this.mouseDown = false;
            this.steering.set(0, 0);
            this.throttle = 0;
        });
    }

    private onTouch(e: TouchEvent) {
        if (!e.touches.length) return;

        const t = e.touches[0];

        this.mouse.set(
            (t.clientX / window.innerWidth) * 2 - 1,
            -(t.clientY / window.innerHeight) * 2 + 1
        );

        this.mouseDown = true;
    }

    /**
     * Call every frame from main.ts
     */
    update(camera: THREE.Camera, ship: any) {
        // -----------------------------
        // 1. throttle (simple radial control)
        // -----------------------------
        const dist = Math.min(1, this.mouse.length());

        const deadzone = 0.15;

        this.throttle = THREE.MathUtils.clamp(
            (dist - deadzone) / (1.0 - deadzone),
            -1,
            1
        );



        // -----------------------------
        // 2. ray from mouse into world
        // -----------------------------
        this.raycaster.setFromCamera(this.mouse, camera);

        // flat plane at ship height (your game is Y-locked)
        const plane = new THREE.Plane(
            new THREE.Vector3(0, 1, 0),
            -ship.mesh.position.y
        );

        const hitPoint = new THREE.Vector3();

        const hit = this.raycaster.ray.intersectPlane(plane, hitPoint);

        if (!hit) {
            this.steering.set(0, 0);
            return;
        }

        // -----------------------------
        // 3. convert world target → ship local space
        // -----------------------------
        const toTarget = hitPoint
            .clone()
            .sub(ship.mesh.position);

        // convert into ship space
        const invQuat = ship.mesh.quaternion.clone().invert();

        toTarget.applyQuaternion(invQuat);

        // -----------------------------
        // 4. steering vector (ship local)
        // -----------------------------
        this.steering.set(toTarget.x, toTarget.z);

        // prevent backwards weirdness
        if (this.steering.lengthSq() > 0.001) {
            this.steering.normalize();
        }

        // optional clamp so it feels stable at edges
        this.steering.x = THREE.MathUtils.clamp(this.steering.x, -1, 1);
        this.steering.y = THREE.MathUtils.clamp(this.steering.y, -1, 1);

        if (!this.mouseDown) {
            this.throttle = 0;
            this.steering.set(0, 0);
            return;
        }
    }
}