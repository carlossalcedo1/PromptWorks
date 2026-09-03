import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // The API has no published port of its own (see deploy/RUNBOOK.md) —
      // in production it's only reachable through Caddy on the same origin
      // at /api/*. Mirroring that here means the dev server and the deployed
      // site hit the exact same relative path, no separate API_BASE_URL to
      // keep in sync, and no CORS to configure for local dev either.
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
})
