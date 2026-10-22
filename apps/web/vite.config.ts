import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Pinned because the port is now part of an OAuth redirect URI. The API
    // derives its own public origin from the incoming Host header (see
    // DISCORD_CALLBACK_URL), so if Vite quietly slid to 5175 the flow would fail
    // at Discord with error 31013 rather than "port in use". strictPort makes
    // that collision say so.
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        // The API's dev port, from PORT in apps/api/.env.
        target: 'http://localhost:5173',
        // Deliberately NOT changeOrigin: that option rewrites Host to the
        // target, so the API would read localhost:5173 as its own public origin
        // and send Discord a redirect URI the browser was never on. The Host
        // header has to survive the proxy for the derived origin to be right.
        changeOrigin: false,
      },
    },
  },
})
