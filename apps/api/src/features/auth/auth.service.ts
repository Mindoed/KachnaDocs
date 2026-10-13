import { Injectable } from '@nestjs/common';

import type { DiscordData } from '@kachnadocs/shared';

import { UsersService } from '../users/users.service.js';
import { DiscordProfile } from 'discord-strategy';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async findOrCreateDiscordUser(profile: DiscordData) {
    await this.usersService.upsertDiscordUser(profile);
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
      guild: {
        id: guild.id,
        name: guild.name,
        icon: guild.icon ?? null,
        banner: guild.banner ?? null,
      },
    };
  }
}
