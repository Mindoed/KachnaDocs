/**
 * WebSocket URL of the Hocuspocus collaboration server.
 *
 * Deliberately not apiUrl()-style same-origin: the REST API and the
 * collaboration server are separate processes (different ports in dev,
 * different proxy routes in prod), so there is no request to piggyback on.
 * Unset VITE_COLLAB_URL means "developing locally" — the collab server's
 * default port on whatever host the page is served from, which also covers
 * opening the dev server from another device on the LAN.
 */
export function collabUrl(): string {
  const configured = import.meta.env.VITE_COLLAB_URL

  if (configured) {
    return configured
  }

  return `ws://${window.location.hostname}:1234`
}
