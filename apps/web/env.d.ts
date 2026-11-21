/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * WebSocket URL of the Hocuspocus collaboration server, e.g.
   * ws://localhost:1234 (dev) or wss://example.com/kachnadocs-collab (prod,
   * behind the same proxy as the API). Unset falls back to
   * ws://<current hostname>:1234 — see src/lib/collab.ts.
   */
  readonly VITE_COLLAB_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
