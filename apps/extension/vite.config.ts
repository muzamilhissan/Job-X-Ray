import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

/** MV3 HTML must not use crossorigin — it can break asset loading in chrome-extension:// pages */
function stripCrossOrigin(): Plugin {
  return {
    name: "strip-crossorigin",
    transformIndexHtml(html) {
      return html.replace(/ +crossorigin/g, "");
    },
  };
}

export default defineConfig({
  plugins: [react(), stripCrossOrigin()],
  // Chrome extensions cannot use absolute "/assets/..." paths — they become chrome-extension://invalid/
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Vite's modulepreload polyfill uses fetch(); disable it for MV3 side panels
    modulePreload: false,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, "sidepanel.html"),
        background: resolve(__dirname, "src/background/index.ts"),
        content: resolve(__dirname, "src/content/index.ts"),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === "background") return "background.js";
          if (chunk.name === "content") return "content.js";
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
