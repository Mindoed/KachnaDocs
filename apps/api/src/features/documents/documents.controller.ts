import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthenticatedGuard, type AuthenticatedRequest } from '../../common/guards/authenticated.guard.js';
import { DocumentsService } from './documents.service.js';

import type { CollaborationTokenDto, DocumentDto } from '@kachnadocs/shared';

@Controller('documents')
@UseGuards(AuthenticatedGuard)
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  list(@Req() req: AuthenticatedRequest): Promise<DocumentDto[]> {
    return this.documents.listForUser(req.user.id);
  }

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body() body: { title?: unknown },
  ): Promise<DocumentDto> {
    return this.documents.create(req.user.id, body?.title);
  }

  @Get(':id')
  getOne(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DocumentDto> {
    return this.documents.getOne(req.user.id, id);
  }

  /** Owner-only sharing: grants (or changes) another user's role. */
  @Put(':id/permissions')
  grant(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { principalId?: unknown; permission?: unknown },
  ): Promise<DocumentDto> {
    return this.documents.grant(req.user.id, id, body?.principalId, body?.permission);
  }

  /**
   * Short-lived, document-scoped token for the Hocuspocus WebSocket. The
   * session cookie authenticates the caller; this endpoint decides *whether
   * they may open this document, and in what role* — the collaboration server
   * then trusts only this signature, never the cookie.
   */
  @Post(':id/collaboration-token')
  collabToken(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CollaborationTokenDto> {
    return this.documents.createCollaborationToken(req.user.id, id);
  }
}
