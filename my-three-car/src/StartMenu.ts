export class StartMenu {
  overlay: HTMLDivElement;
  button: HTMLButtonElement;

  private loadingBarContainer: HTMLDivElement;
  private loadingBarFill: HTMLDivElement;

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

    // -------------------------
    // LOADING BAR
    // -------------------------
    this.loadingBarContainer = document.createElement("div");
    this.loadingBarContainer.style.width = "320px";
    this.loadingBarContainer.style.height = "10px";
    this.loadingBarContainer.style.border = "1px solid white";
    this.loadingBarContainer.style.marginTop = "24px";
    this.loadingBarContainer.style.display = "none";

    this.loadingBarFill = document.createElement("div");
    this.loadingBarFill.style.width = "0%";
    this.loadingBarFill.style.height = "100%";
    this.loadingBarFill.style.background = "white";

    this.loadingBarContainer.appendChild(this.loadingBarFill);

    this.overlay.appendChild(title);
    this.overlay.appendChild(subtitle);
    this.overlay.appendChild(this.button);
    this.overlay.appendChild(this.loadingBarContainer);
  }

  async show(): Promise<void> {
    document.body.appendChild(this.overlay);

    return new Promise((resolve) => {
      this.button.addEventListener(
        "click",
        async () => {
          this.button.disabled = true;
          this.button.style.display = "none";
          this.loadingBarContainer.style.display = "block";

          // IMPORTANT: force browser paint BEFORE loading starts
          await new Promise(requestAnimationFrame);

          await this.runFakeLoading();

          this.overlay.remove();
          resolve();
        },
        { once: true }
      );
    });
  }

  private runFakeLoading(): Promise<void> {
    return new Promise((resolve) => {
      let progress = 0;

      const interval = setInterval(() => {
        progress += 0.02;

        this.loadingBarFill.style.width = `${progress * 100}%`;

        if (progress >= 1) {
          clearInterval(interval);
          resolve();
        }
      }, 16);
    });
  }
}