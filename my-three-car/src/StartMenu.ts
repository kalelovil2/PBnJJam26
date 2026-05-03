export class StartMenu {
  overlay: HTMLDivElement;
  button: HTMLButtonElement;

  constructor() {
    this.overlay = document.createElement("div");

    this.overlay.style.position = "fixed";
    this.overlay.style.inset = "0";
    this.overlay.style.background = "black";
    this.overlay.style.display = "flex";
    this.overlay.style.flexDirection = "column";
    this.overlay.style.alignItems = "center";
    this.overlay.style.justifyContent = "center";
    this.overlay.style.color = "white";
    this.overlay.style.fontFamily = "sans-serif";
    this.overlay.style.zIndex = "1000";

    const title = document.createElement("h1");
    title.textContent = "Cosmic Trucker";

    const subtitle = document.createElement("p");
    subtitle.textContent =
      "Deliver cargo. Avoid contraband inspections.";

    this.button = document.createElement("button");
    this.button.textContent = "START";

    this.button.style.padding = "16px 32px";
    this.button.style.fontSize = "24px";
    this.button.style.cursor = "pointer";

    this.overlay.appendChild(title);
    this.overlay.appendChild(subtitle);
    this.overlay.appendChild(this.button);
  }

  async show(): Promise<void> {
    document.body.appendChild(this.overlay);

    return new Promise((resolve) => {
      this.button.addEventListener(
        "click",
        () => {
          this.overlay.remove();
          resolve();
        },
        { once: true }
      );
    });
  }
}