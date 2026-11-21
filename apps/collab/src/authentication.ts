import process from 'node:process';

import type { onAuthenticatePayload } from '@hocuspocus/server';
import { jwtVerify } from 'jose';

import {
  COLLAB_AUDIENCE,
  COLLAB_ISSUER,
  collabDocumentName,
  type CollaborationRole,
} from '@kachnadocs/shared';

import { getDocumentAccess } from './db.ts';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const rawSecret = process.env.COLLAB_JWT_SECRET;

if (!rawSecret) {
  console.error(
    '[collab] COLLAB_JWT_SECRET is not set — it must match the value the API signs ' +
      'collaboration tokens with (apps/api/.env).',
  );
  process.exit(1);
}

const secret = new TextEncoder().encode(rawSecret);

/**
 * Every WebSocket authentication (initial connect *and* the provider's
 * token refresh) runs through here. Three layers, cheapest first:
 *
 *  1. Signature, issuer, audience, expiry — the token really came from our API.
 *  2. Claim shape and `documentName` match — a token for document A cannot be
 *     replayed against document B.
 *  3. The live ACL in PostgreSQL — access revoked (or downgraded) since the
 *     token was minted is caught here, at the latest within the token's TTL
 *     because the provider re-authenticates when it refreshes.
 */
export async function onAuthenticate({
  token,
  documentName,
  connectionConfig,
}: onAuthenticatePayload): Promise<Record<string, unknown>> {
  if (typeof token !== 'string' || token.length === 0) {
    throw new Error('Missing collaboration token');
  }

  let payload;
  try {
    ({ payload } = await jwtVerify(token, secret, {
      audience: COLLAB_AUDIENCE,
      issuer: COLLAB_ISSUER,
    }));
  } catch {
    // One message for every cryptographic failure — do not tell an attacker
    // which of signature/expiry/audience failed.
    throw new Error('Invalid collaboration token');
  }

  const userId = payload.sub;
  const documentId = payload.documentId;
  const role = payload.role;

  if (
    typeof documentId !== 'string' ||
    !UUID_RE.test(documentId) ||
    typeof userId !== 'string' ||
    (role !== 'viewer' && role !== 'editor')
  ) {
    throw new Error('Invalid collaboration token');
  }

  if (documentName !== collabDocumentName(documentId)) {
    throw new Error('Document mismatch');
  }

  const aclRole = await getDocumentAccess(documentId, userId);
  if (aclRole === null) {
    throw new Error('Document not found or access revoked');
  }

  const effective: CollaborationRole = aclRole === 'viewer' ? 'viewer' : 'editor';

  if (role === 'editor' && effective === 'viewer') {
    throw new Error('Edit access revoked since this token was issued');
  }

  // Viewers still receive every update — they just cannot send one.
  if (effective === 'viewer') {
    connectionConfig.readOnly = true;
  }

  return { userId, documentId, role: effective };
}
