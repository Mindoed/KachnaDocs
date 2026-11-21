import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import type { DiscordUser } from '@kachnadocs/shared';

/**
 * Session-cookie gate for routes that simply require a logged-in user.
 *
 * Deliberately not `AuthGuard('discord')`: that one starts the whole OAuth
 * redirect dance, which is what the login button is for. Here an anonymous
 * caller gets a 401 and the SPA decides to show the login view.
 */
@Injectable()
export class AuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: DiscordUser }>();

    if (!request.isAuthenticated?.() || !request.user) {
      throw new UnauthorizedException('Not signed in.');
    }

    return true;
  }
}

/** Request as seen by handlers behind AuthenticatedGuard. */
export type AuthenticatedRequest = Request & { user: DiscordUser };
