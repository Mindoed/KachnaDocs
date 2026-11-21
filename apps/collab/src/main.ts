import 'dotenv/config';
import process from 'node:process';

import { Server } from '@hocuspocus/server';

import { onAuthenticate } from './authentication.ts';
import { closeDb } from './db.ts';
import { persistence } from './persistence.ts';

const port = Number(process.env.COLLAB_PORT ?? 1234);

const server = new Server({
  port,

  /**
   * Authentication is the only gate into a document. `persistence` then owns
   * loading and saving the binary Yjs state.
   */
  onAuthenticate,
  extensions: [persistence],

  async onDisconnect({ documentName, clientsCount }) {
    console.log(
      `[collab] ${documentName}: ${clientsCount} client(s) connected after disconnect`,
    );
  },
});

await server.listen();
console.log(`[collab] Hocuspocus listening on ws://localhost:${port}`);

// Graceful shutdown: flush what we can, close the pool, then go. The
// debounced store on last-client-disconnect has already fired for idle
// documents; anything newer is recovered from the clients' next connection.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    console.log(`[collab] ${signal} received, shutting down`);
    server
      .destroy()
      .catch((error: unknown) => console.error('[collab] destroy failed:', error))
      .finally(() => closeDb().finally(() => process.exit(0)));
  });
}
