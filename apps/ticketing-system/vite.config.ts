import { existsSync, readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import reactSwc from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";

const isVitest = Boolean(process.env.VITEST);

/** Vite empties `dist` before writing. Keep an existing IIS `web.config`. */
function preserveWebConfig(): Plugin {
  let outDir = "";

  return {
    name: "preserve-web-config",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    buildStart() {
      if (!outDir || !existsSync(outDir)) return;

      for (const entry of readdirSync(outDir)) {
        if (entry === "web.config" || entry === ".git") continue;
        rmSync(resolve(outDir, entry), { recursive: true, force: true });
      }
    },
  };
}

export default defineConfig({
  resolve: {
    // @tiptap/pm is subpath-only (no "." export) — do not dedupe/optimize the bare package.
    dedupe: [
      "react",
      "react-dom",
      "prosemirror-model",
      "prosemirror-state",
      "prosemirror-view",
      "prosemirror-transform",
    ],
  },
  optimizeDeps: {
    include: [
      "prosemirror-model",
      "@tiptap/extension-mention",
      "@tiptap/suggestion",
    ],
  },
  plugins: [
    preserveWebConfig(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routeFileIgnorePattern: "\\.(test|spec)\\.",
    }),
    reactSwc(),
    tsconfigPaths(),
    // Only stub CSS modules during Vitest — never in dev/build.
    isVitest
      ? {
          name: "stub-css",
          transform(_code, id) {
            if (id.endsWith(".css")) {
              return { code: "export {}", map: null };
            }
          },
        }
      : null,
  ].filter(Boolean),
  build: {
    emptyOutDir: false,
  },
  server: {
    host: true,
    allowedHosts: [
      "ticketing.localhost.test",
      ".localhost.test",
      "itc-ts.localhost.test",
    ],
    fs: {
      allow: [".."],
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    testTimeout: 20_000,
  },
});
