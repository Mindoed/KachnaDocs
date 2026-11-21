import { Database } from '@hocuspocus/extension-database';

import { fetchState, storeState } from './db.ts';

function getDocumentId(documentName: string): string {
  const match = /^document\.([0-9a-f-]{36})$/i.exec(documentName);

  if (!match?.[1]) {
    throw new Error(`Invalid document name: ${documentName}`);
  }

  return match[1];
}

/**
 * Binary persistence for the live collaborative state.
 *
 * The column stores an encoded Yjs update (BYTEA). It must never be rebuilt
 * from JSON: a Y.Doc recreated from serialized JSON loses its CRDT identity,
 * and two clients holding different histories then duplicate content instead
 * of merging it.
 *
 * A `null` fetch means "document exists, no content yet" — a *nonexistent*
 * document never reaches this extension, because onAuthenticate rejects it
 * before a Y.Doc is created.
 */
export const persistence = new Database({
  fetch: async ({ documentName }) => {
    return fetchState(getDocumentId(documentName));
  },

  store: async ({ documentName, state }) => {
    try {
      await storeState(getDocumentId(documentName), state);
    } catch (error) {
      // Log loudly and rethrow: a swallowed store error is silent document
      // loss. Hocuspocus logs the rejection; the debounced retry on the next
      // change eventually writes a newer state.
      console.error(`[collab] Failed to persist ${documentName}:`, error);
      throw error;
    }
  },
});
