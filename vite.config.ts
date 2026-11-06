import { defineConfig } from "vite";

export default defineConfig({
  // GitHub Pages serves the site from /<repo>/; the deploy workflow passes
  // that path in BASE_PATH. Locally it's "/". Code that builds URLs at
  // runtime uses import.meta.env.BASE_URL (see src/lib/url.ts).
  base: process.env.BASE_PATH || "/",
  server: {
    fs: {
      // The project folder name contains ":" ("A:W-DesignSystem"), which makes
      // Vite's allow-list check reject files inside its own root. Dev-server
      // only; safe to remove if the folder is renamed without a colon.
      strict: false,
    },
  },
});
