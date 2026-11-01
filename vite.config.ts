import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  envPrefix: ["VITE_", "TAURI_ENV_"],
  server: {
    watch: {
      ignored: ["**/src-tauri/**", "**/.npm-cache/**", "**/test-results/**"],
    },
  },
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks: {
          calendar: ["lunar-typescript"],
          react: ["react", "react-dom", "react-dom/client"],
        },
      },
    },
  },
});
