import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron";
import electronRenderer from "vite-plugin-electron-renderer";

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: "electron/main.ts",
        vite: {
          build: { outDir: "dist-electron", rollupOptions: { external: ["electron", "electron-updater"] } },
        },
      },
      {
        entry: "electron/preload.ts",
        onstart({ reload }) { reload(); },
        vite: { build: { outDir: "dist-electron" } },
      },
    ]),
    electronRenderer(),
  ],
  build: { outDir: "dist" },
  server: { port: 5173 },
});
