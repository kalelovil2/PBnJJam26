import * as THREE from "three";

export class ContrabandAlert {
    private flash: HTMLDivElement;
    private text: HTMLDivElement;

    private timer = 0;

    // shake
    private shakeTimer = 0;
    private shakeStrength = 0;

    private cameraBasePos;

    private camera : THREE.Camera;

    constructor(camera: THREE.Camera) {

        this.camera = camera;

        //
        // RED FLASH
        //
        this.flash = document.createElement("div");
        this.flash.style.position = "fixed";
        this.flash.style.inset = "0";
        this.flash.style.background = "#ff220067";
        this.flash.style.opacity = "0.3";
        this.flash.style.pointerEvents = "none";
        this.flash.style.zIndex = "99999";

        document.body.appendChild(this.flash);

        //
        // TEXT WARNING
        //
        this.text = document.createElement("div");
        this.text.style.position = "fixed";
        this.text.style.left = "50%";
        this.text.style.top = "45%";
        this.text.style.transform = "translate(-50%, -50%)";
        this.text.style.color = "white";
        this.text.style.fontFamily = "monospace";
        this.text.style.fontSize = "28px";
        this.text.style.letterSpacing = "2px";
        this.text.style.opacity = "0";
        this.text.style.zIndex = "100000";

        this.text.innerText = "CONTRABAND DETECTED";

        document.body.appendChild(this.text);
    }

    trigger() {
        this.timer = 2.25;

        // shake setup
        this.shakeTimer = 1.75;
        this.shakeStrength = 0.06;
    }

    update(dt: number) {
        //
        // FLASH FADE
        //
        this.timer = Math.max(0, this.timer - dt);

        const flashAlpha = this.timer / 0.4;
        this.flash.style.opacity = (flashAlpha * 0.35).toString();

        this.text.style.opacity = flashAlpha.toString();

        //
        // SCREEN SHAKE
        //
        this.shakeTimer = Math.max(0, this.shakeTimer - dt);

        if (this.shakeTimer > 0) {
            const decay = this.shakeTimer / 0.4;
            const strength = this.shakeStrength * decay;

            const offsetX = (Math.random() - 0.5) * strength;
            const offsetY = (Math.random() - 0.5) * strength;

            this.camera.position.x += offsetX;
            this.camera.position.y += offsetY;
        }
    }
}