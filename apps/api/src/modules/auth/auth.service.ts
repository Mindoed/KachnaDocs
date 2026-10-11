import { Injectable } from '@nestjs/common';

import type { DiscordProfile } from 'discord-strategy';

import type { DiscordData } from '@kachnadocs/shared';

import { UsersService } from '../users/users.service.js';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async findOrCreateDiscordUser(profile: DiscordProfile) {
    return await this.usersService.upsertDiscordUser(profile);
  }

  filterProfile(guildId: string, profile: DiscordProfile): DiscordData | null {
    const guild = profile.guilds?.find((g: { id: string }) => g.id === guildId);
    if (!guild) {
      return null;
    }

    //exlude guilds from profile to avoid sending unnecessary data
    delete profile.guilds;

    return {
      ...profile,
      guild: guild,
    };
  }
}
