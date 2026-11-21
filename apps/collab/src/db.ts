import process from 'node:process';

import { Pool, type QueryResultRow } from 'pg';

import type { DocumentRole } from '@kachnadocs/shared';

/**
 * One pool, shared by the authentication hook and the database extension.
 *
 * The collab server deliberately reads the *same* tables the API owns —
 * documents, document_permissions — instead of trusting a JWT claim forever:
 * a token minted before an access change is caught against the live ACL on
 * every (re)authentication, which is what makes revocation real. It only
 * *writes* document_states, the Yjs binary column.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    '[collab] DATABASE_URL is not set. Copy apps/collab/.env.example to apps/collab/.env\n' +
      '(a PostgreSQL instance is provided by infra/docker-compose.yml).',
  );
  process.exit(1);
}

export const pool = new Pool({ connectionString });

async function queryOne<T extends QueryResultRow>(
  text: string,
  params: readonly unknown[],
): Promise<T | undefined> {
  const result = await pool.query<T>(text, params as unknown[]);
  return result.rows[0];
}

/** Current ACL entry for a user on a document; null when neither exists. */
export async function getDocumentAccess(
  documentId: string,
  userId: string,
): Promise<DocumentRole | null> {
  // The join against documents doubles as the existence check: a token for a
  // deleted document finds no row, so no empty Y.Doc is ever resurrected.
  const row = await queryOne<{ permission: DocumentRole }>(
    `SELECT p.permission
       FROM document_permissions p
       JOIN documents d ON d.id = p.document_id
      WHERE p.document_id = $1
        AND p.principal_type = 'user'
        AND p.principal_id = $2`,
    [documentId, userId],
  );

  return row?.permission ?? null;
}

export async function fetchState(documentId: string): Promise<Uint8Array | null> {
  const row = await queryOne<{ yjs_state: Buffer | null }>(
    `SELECT yjs_state FROM document_states WHERE document_id = $1`,
    [documentId],
  );

  const state = row?.yjs_state;
  return state ? new Uint8Array(state) : null;
}

export async function storeState(documentId: string, state: Uint8Array): Promise<void> {
  await pool.query(
    `INSERT INTO document_states (document_id, yjs_state, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (document_id)
     DO UPDATE SET yjs_state = EXCLUDED.yjs_state, updated_at = NOW()`,
    [documentId, Buffer.from(state)],
  );
}

export async function closeDb(): Promise<void> {
  await pool.end();
}
