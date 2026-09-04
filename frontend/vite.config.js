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
        // Caddy's `handle_path /api/*` strips the /api prefix before
        // forwarding to the api container in production (see Caddyfile),
        // so POST /api/attempts arrives at the app as POST /attempts and
        // FastAPI's routes carry no prefix of their own. Vite's proxy does
        // NOT strip prefixes by default, so without this rewrite, local
        // dev sends the full /api/attempts path straight through and every
        // request 404s against routes that don't expect it.
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
 