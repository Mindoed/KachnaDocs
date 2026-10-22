/**
 * Mount point of the whole app behind a shared reverse proxy: '/kachnadocs' for
 * a site served at https://example.com/kachnadocs/, '' when the app owns the
 * origin root. Comes from BASE_PATH, which describes the *deployment* rather
 * than this process — the container does not care what path its proxy happens to
 * use internally, only where the site is reachable from a browser.
 *
 * Accepts '/kachnadocs', 'kachnadocs' or '/kachnadocs/' and always returns the
 * '' | '/kachnadocs' shape, with no trailing slash: an empty result then means
 * "root", so `${basePath}${path}` needs no special case.
 *
 * The SPA is built for the same value as VITE_BASE_PATH
 * (apps/web/vite.config.ts), where the equivalent spelling keeps its trailing
 * slash because that is how Vite wants `base`.
 */
export function normalizeBasePath(value: string | undefined): string {
  const trimmed = (value ?? '').trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}` : '';
}
