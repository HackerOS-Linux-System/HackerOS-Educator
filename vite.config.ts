import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

// Konfiguracja zgodna z wymaganiami Tauri v2:
// - stały port dev servera
// - ignorowanie katalogu src-tauri przez watcher
export default defineConfig(async () => ({
  plugins: [solid()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
}));
