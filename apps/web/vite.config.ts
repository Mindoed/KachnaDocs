import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

/**
 * Accepts 'kachnadocs', '/kachnadocs' or '/kachnadocs/' and returns the form
 * Vite wants: '/kachnadocs/'. Anything falsy means the origin root, '/'.
 */
function normalizeBase(value: string | undefined): string {
  const trimmed = (value ?? '').trim().replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}/` : '/'
}

// Path the app is published under: '/kachnadocs/' for a site served at
// https://example.com/kachnadocs/ by a proxy that shares its origin with other
// apps, '/' (unset) for the origin root — which is what local dev uses.
//
// Build-time only; it cannot be demoted to a run-time variable. Vite writes
// `base` into index.html *and* into the URLs the emitted JS resolves lazy route
// chunks against, so a bundle built for one mount point 404s its own assets
// under another, and server-side rewriting of index.html alone would never
// catch the chunk URLs inside the JS. The API takes the same value at run time
// as BASE_PATH (apps/api/src/main.ts), and src/lib/paths.ts reads this one back
// through import.meta.env.BASE_URL.
const BASE_PATH = normalizeBase(process.env.VITE_BASE_PATH)

// https://vite.dev/config/
export default defineConfig({
  base: BASE_PATH,
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
      // Keyed off the base instead of hardcoded '/api', so a dev server started
      // with VITE_BASE_PATH=/kachnadocs proxies exactly the URLs src/lib/paths.ts
      // asks for. With the usual unset base this is '/api'.
      [`${BASE_PATH}api`]: {
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
