import { defineConfig } from "vite";

export default defineConfig({
  server: {
    fs: {
      // The project folder name contains ":" ("A:W-DesignSystem"), which makes
      // Vite's allow-list check reject files inside its own root. Dev-server
      // only; safe to remove if the folder is renamed without a colon.
      strict: false,
    },
  },
});
