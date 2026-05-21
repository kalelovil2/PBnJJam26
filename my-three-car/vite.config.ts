import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  base: "/pbjam26/",
  plugins: [wasm()],
  build: {
    outDir: "dist"
  },
  optimizeDeps: {
    exclude: ["@dimforge/rapier3d"]
  }
});