import { Controller, Get, Redirect, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Logger } from '@nestjs/common';

import { AuthService } from './auth.service.js';
import type { Request, Response } from 'express';
import { DiscordData } from '@kachnadocs/shared';

@Controller('auth')
export class AuthController {
  constructor(private readonly appService: AuthService) {}
  private readonly logger = new Logger(AuthController.name);

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('discord')
  @UseGuards(AuthGuard('discord'))
  login() {
    // Passport redirects to Discord
  }

  @Get('discord/callback')
  @UseGuards(AuthGuard('discord'))
  callback(@Res() res: Response) {
    this.logger.debug('Discord callback called:', res.locals.user);

    return res.redirect('http://localhost:5173/dashboard');
  }

  @Get('me')
  getCurrentUser(@Req() req: Request) {
    // if (!req.isAuthenticated) {
    //   return { user: null };
    // }

    const user = req.user as DiscordData | undefined;
    return { user: user ?? null };
  }
}
