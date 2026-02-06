import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tsconfigPaths(),
  ],
  server: {
    host: true,
    allowedHosts: ['drs.localhost.test'],
    fs: {
      allow: ['..'],
    },
  },
});
