import { Controller, Get, Redirect, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Logger } from '@nestjs/common';

import { AuthService } from './auth.service.js';
import type { Request, Response } from 'express';
import { DiscordUser } from '@kachnadocs/shared';

@Controller('auth')
export class AuthController {
  constructor(private readonly appService: AuthService) {}
  private readonly logger = new Logger(AuthController.name);

  @Get('discord')
  @UseGuards(AuthGuard('discord'))
  login() {
    // Passport redirects to Discord
  }

  @Get('discord/callback')
  @UseGuards(AuthGuard('discord'))
  async callback(@Res() res: Response, @Req() req: Request) {
    this.logger.debug('Discord callback called:', res.locals.user);

    await new Promise<void>((resolve, reject) => {
      req.logIn(req.user!, (error: Error | null) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    this.logger.debug(`Authenticated: ${req.isAuthenticated()}`);

    // The session cookie for this origin is now in the browser's cookie jar,
    // and it is shared across tabs — the opener's next credentialed fetch
    // (GET /api/auth/me) will already be authenticated. The popup page below
    // only needs to tell the opener "you're done", via postMessage.
    const frontendUrl = `${req.protocol}://${req.get('host')}`;

    return res.type('html').send(this.appService.popupDonePage(frontendUrl, '/'));
  }

  @Get('me')
  getCurrentUser(@Req() req: Request) {
    // if (!req.isAuthenticated) {
    //   return { user: null };
    // }

    this.logger.debug('SessionID:' + req.sessionID);
    this.logger.debug(`Authenticated: ${req.isAuthenticated()}`);
    this.logger.debug(`User: ${JSON.stringify(req.user)}`);

    const user = req.user as DiscordUser | undefined;
    return {
      authenticated: req.isAuthenticated(),
      user: req.user ?? null,
    };
  }
}
