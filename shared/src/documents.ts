/**
 * Document access-control and collaboration contracts shared by the API, the
 * collaboration server and the web client.
 *
 * `owner` is an application-level role (manage sharing); on the wire to
 * Hocuspocus it collapses to `editor`, because the collaboration server only
 * distinguishes read-write from read-only.
 */
export type DocumentRole = 'viewer' | 'editor' | 'owner';

/** What a Hocuspocus token may claim — see apps/api documents.service. */
export type CollaborationRole = 'viewer' | 'editor';

export function collaborationRole(role: DocumentRole): CollaborationRole {
  return role === 'viewer' ? 'viewer' : 'editor';
}

export interface DocumentDto {
  id: string;
  title: string;
  createdBy: string;
  createdAt: string;
  /** The requesting user's role on this document. */
  role: DocumentRole;
}

export interface CollaborationTokenDto {
  token: string;
  documentId: string;
  role: CollaborationRole;
  /** ISO timestamp; the client is expected to re-request before this. */
  expiresAt: string;
}

/** Audience the API signs collaboration JWTs for, and the collab server verifies. */
export const COLLAB_AUDIENCE = 'kachnadocs-collaboration';
/** Issuer claim of those same JWTs. */
export const COLLAB_ISSUER = 'kachnadocs-api';
/** Yjs/Hocuspocus document name for an application document id. */
export function collabDocumentName(documentId: string): string {
  return `document.${documentId}`;
}
