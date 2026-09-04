import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import reactSwc from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";

const isVitest = Boolean(process.env.VITEST);

export default defineConfig({
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "prosemirror-model",
      "prosemirror-state",
      "prosemirror-view",
      "prosemirror-transform",
      "@tiptap/pm",
    ],
  },
  optimizeDeps: {
    include: [
      "prosemirror-model",
      "@tiptap/pm",
      "@tiptap/extension-mention",
      "@tiptap/suggestion",
    ],
  },
  plugins: [
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
