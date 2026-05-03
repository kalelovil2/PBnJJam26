import { defineConfig } from "vite";

export default defineConfig({
  base: "./", // IMPORTANT for itch.io
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});