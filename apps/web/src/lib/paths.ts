/**
 * Where the app is mounted, exactly as Vite was told at build time (`base` in
 * apps/web/vite.config.ts). Always ends in a slash: '/' when the app owns the
 * origin root, '/kachnadocs/' when a shared proxy mounts it under a sub-path.
 *
 * The router already knows — createWebHistory(import.meta.env.BASE_URL) in
 * src/router/index.ts — so only the handful of URLs handed to the browser
 * outside the router (fetch, window.open, location.href) need these helpers.
 * Writing '/api/...' or '/auth' by hand instead is what makes a deployment under
 * a sub-path request the origin root and 404.
 */
const BASE_PATH = import.meta.env.BASE_URL

/**
 * API route as the browser has to request it: '/auth/me' ->
 * '/kachnadocs/api/auth/me' (or '/api/auth/me' at the origin root). The 'api'
 * segment is the API's global prefix (setGlobalPrefix in apps/api/src/main.ts).
 *
 * Same-origin and proxied to the API as before — in the container by whatever
 * fronts it, in dev by Vite (apps/web/vite.config.ts) — just not necessarily
 * from the origin root.
 */
export function apiUrl(path: string): string {
  return `${BASE_PATH}api${path}`
}

/**
 * App route for the places that leave the router behind: '/auth' ->
 * '/kachnadocs/auth'. Where a router instance is in reach, use it instead; it
 * applies the base path on its own.
 */
export function appUrl(path: string): string {
  return `${BASE_PATH}${path.replace(/^\/+/, '')}`
}
