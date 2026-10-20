import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // `true` binds IPv6 only. Windows resolves this host to 127.0.0.1, so Firefox never reaches that socket.
    host: '0.0.0.0',
    port: 5174,
    allowedHosts: ['abms.localhost.test'],
    fs: {
      allow: ["../../"],
    },
  },
})
