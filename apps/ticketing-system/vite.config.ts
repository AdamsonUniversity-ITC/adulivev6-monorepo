import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import reactSwc from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";

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
    allowedHosts: [
      "ticketing.localhost.test",
      ".localhost.test",
      "itc-ts.localhost.test",
    ],
    proxy: {
      "/hrmdo-api": {
        // Docker publishes hrmdo on :8003; *.localhost.test often fails DNS in WSL
        target: "http://127.0.0.1:8003",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/hrmdo-api/, "/api"),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            const host = req.headers.host;
            if (!host) return;

            proxyReq.setHeader("X-Forwarded-Host", host);
            // Browser GETs often omit Origin; board tenancy needs the MFE host.
            if (!req.headers.origin) {
              const proto = req.headers["x-forwarded-proto"] ?? "http";
              proxyReq.setHeader("Origin", `${proto}://${host}`);
            }
          });
        },
      },
    },
    fs: {
      allow: [".."],
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
