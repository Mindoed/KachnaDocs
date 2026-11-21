import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignJWT } from 'jose';

import { DatabaseService } from '../../common/database/database.service.js';
import {
  COLLAB_AUDIENCE,
  COLLAB_ISSUER,
  collaborationRole,
  type CollaborationTokenDto,
  type DocumentDto,
  type DocumentRole,
} from '@kachnadocs/shared';

interface DocumentRow {
  id: string;
  title: string;
  created_by: string;
  created_at: Date;
  permission: DocumentRole;
}

/** Lifetime of a collaboration token. Short on purpose: it is the lever that
 *  revokes an active WebSocket session — the provider re-requests it through
 *  onTokenExpiration, so a revoked user is dropped within this window. */
const COLLAB_TOKEN_TTL_SECONDS = 15 * 60;

const MAX_TITLE_LENGTH = 200;

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  private toDto(row: DocumentRow): DocumentDto {
    return {
      id: row.id,
      title: row.title,
      createdBy: row.created_by,
      createdAt: row.created_at.toISOString(),
      role: row.permission,
    };
  }

  async create(userId: string, title: unknown): Promise<DocumentDto> {
    const cleanTitle =
      typeof title === 'string' && title.trim() ? title.trim().slice(0, MAX_TITLE_LENGTH) : 'Untitled';

    // Data-modifying CTEs always run to completion in Postgres, referenced or
    // not, so the owner grant lands while the final SELECT reads the row back
    // straight off `doc` — an INSERT's own RETURNING could not reach it.
    const inserted = await this.db.query<DocumentRow>(
      `WITH doc AS (
         INSERT INTO documents (title, created_by)
         VALUES ($1, $2)
         RETURNING id, title, created_by, created_at
       ), perm AS (
         INSERT INTO document_permissions (document_id, principal_id, permission)
         SELECT id, $2, 'owner' FROM doc
         RETURNING 1
       )
       SELECT id, title, created_by, created_at, 'owner'::text AS permission
         FROM doc`,
      [cleanTitle, userId],
    );

    return this.toDto(inserted.rows[0]!);
  }

  async listForUser(userId: string): Promise<DocumentDto[]> {
    const result = await this.db.query<DocumentRow>(
      `SELECT d.id, d.title, d.created_by, d.created_at, p.permission
         FROM documents d
         JOIN document_permissions p
           ON p.document_id = d.id
          AND p.principal_type = 'user'
          AND p.principal_id = $1
        ORDER BY d.created_at DESC`,
      [userId],
    );

    return result.rows.map((row) => this.toDto(row));
  }

  /** The user's role on a document, or null when there is no grant (or no document). */
  async getRole(userId: string, documentId: string): Promise<DocumentRole | null> {
    const result = await this.db.query<{ permission: DocumentRole }>(
      `SELECT permission
         FROM document_permissions
        WHERE document_id = $1 AND principal_type = 'user' AND principal_id = $2`,
      [documentId, userId],
    );

    return result.rows[0]?.permission ?? null;
  }

  async getOne(userId: string, documentId: string): Promise<DocumentDto> {
    const result = await this.db.query<DocumentRow>(
      `SELECT d.id, d.title, d.created_by, d.created_at, p.permission
         FROM documents d
         JOIN document_permissions p
           ON p.document_id = d.id
          AND p.principal_type = 'user'
          AND p.principal_id = $2
        WHERE d.id = $1`,
      [documentId, userId],
    );

    const row = result.rows[0];
    if (!row) {
      // One error for "missing" and "not yours" — the distinction tells an
      // unauthenticated caller which document ids exist.
      throw new NotFoundException('Document not found.');
    }

    return this.toDto(row);
  }

  /** Share a document. Only owners manage access (the MANAGE level). */
  async grant(
    actorId: string,
    documentId: string,
    principalId: unknown,
    permission: unknown,
  ): Promise<DocumentDto> {
    const role = await this.getRole(actorId, documentId);
    if (role !== 'owner') {
      throw new ForbiddenException('Only the document owner can manage access.');
    }

    if (
      typeof principalId !== 'string' ||
      !/^[0-9]{1,32}$/.test(principalId) ||
      (permission !== 'viewer' && permission !== 'editor' && permission !== 'owner')
    ) {
      throw new BadRequestException('principalId must be a Discord id and permission one of viewer/editor/owner.');
    }

    await this.db.query(
      `INSERT INTO document_permissions (document_id, principal_id, permission)
       VALUES ($1, $2, $3)
       ON CONFLICT (document_id, principal_type, principal_id)
       DO UPDATE SET permission = EXCLUDED.permission`,
      [documentId, principalId, permission],
    );

    return this.getOne(actorId, documentId);
  }

  async createCollaborationToken(userId: string, documentId: string): Promise<CollaborationTokenDto> {
    const role = await this.getRole(userId, documentId);
    if (!role) {
      throw new NotFoundException('Document not found.');
    }

    const secret = new TextEncoder().encode(
      this.config.getOrThrow<string>('COLLAB_JWT_SECRET'),
    );

    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + COLLAB_TOKEN_TTL_SECONDS;
    const collabRole = collaborationRole(role);

    const token = await new SignJWT({ documentId, role: collabRole })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuer(COLLAB_ISSUER)
      .setAudience(COLLAB_AUDIENCE)
      .setIssuedAt(issuedAt)
      .setExpirationTime(expiresAt)
      .sign(secret);

    this.logger.debug(`Issued collaboration token for doc ${documentId} / user ${userId}`);

    return {
      token,
      documentId,
      role: collabRole,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
    };
  }
}
