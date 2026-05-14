import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

// This is a standard Vite SPA configuration.
// We are bypassing the Lovable SSR config to ensure a clean build for Netlify.
export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    tsconfigPaths(),
  ],
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
