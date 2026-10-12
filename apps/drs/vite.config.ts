import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tsconfigPaths(),
  ],
  server: {
    // `true` binds IPv6 only. Windows resolves this host to 127.0.0.1, so Firefox never reaches that socket.
    host: '0.0.0.0',
    allowedHosts: ['college-drs.localhost.test', 'shs-drs.localhost.test'],
    fs: {
      allow: ['..'],
    },
  },
});
