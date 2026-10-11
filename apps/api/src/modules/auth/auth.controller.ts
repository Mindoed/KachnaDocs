import { Controller, Get, Redirect, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly appService: AuthService) {}

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
    return Redirect('http://localhost:5173/auth'); // Redirect to your frontend after successful authentication
  }

  @Get('me')
  getCurrentUser(@Req() req: Request) {
    if (!req.isAuthenticated) {
      return { user: null };
    }

    return { user: req.user };
  }
}
