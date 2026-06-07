import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import reactSwc from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    reactSwc(),
    tsconfigPaths(),
  ],
  server: {
    host: true,
    allowedHosts: ["eleave.localhost.test"],
    proxy: {
      "/hrmdo-api": {
        target: "http://hrmdo.api.localhost.test:8003",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/hrmdo-api/, "/api"),
      },
    },
    fs: {
      allow: [".."],
    },
  },
});
