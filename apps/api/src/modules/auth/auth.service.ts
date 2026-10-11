import { Injectable } from '@nestjs/common';

import type { DiscordProfile } from 'discord-strategy';

import { UsersService } from '../users/users.service.js';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async findOrCreateDiscordUser(profile: DiscordProfile) {
    return this.usersService.upsertDiscordUser(profile);
  }
}
