import { existsSync, readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig, type Plugin } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

/** Vite empties `dist` before writing. Keep an existing IIS `web.config`. */
function preserveWebConfig(): Plugin {
  let outDir = '';

  return {
    name: 'preserve-web-config',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    buildStart() {
      if (!outDir || !existsSync(outDir)) return;

      for (const entry of readdirSync(outDir)) {
        if (entry === 'web.config' || entry === '.git') continue;
        rmSync(resolve(outDir, entry), { recursive: true, force: true });
      }
    },
  };
}

export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  plugins: [
    preserveWebConfig(),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tsconfigPaths(),
  ],
  build: {
    emptyOutDir: false,
  },
  server: {
    // `true` binds IPv6 only. Windows resolves this host to 127.0.0.1, so Firefox never reaches that socket.
    host: '0.0.0.0',
    allowedHosts: ['college-drs.localhost.test', 'shs-drs.localhost.test'],
    fs: {
      allow: ['..'],
    },
  },
});
