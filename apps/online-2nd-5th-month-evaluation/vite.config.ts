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
    allowedHosts: ["online-2nd-5th-evaluation.localhost.test"],
    fs: {
      allow: [".."],
    },
  },
});
