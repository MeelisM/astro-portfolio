// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://www.meelis.dev",
  experimental: {
    svg: true,
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      minify: true,
      rollupOptions: {
        output: {
          manualChunks: {},
        },
      },
    },
  },
});
