import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { DiscordData } from '@kachnadocs/shared';

@Injectable()
export class UsersService {
  private readonly users = new Map<string, DiscordData>();

  constructor(private readonly config: ConfigService) {}

  async upsertDiscordUser(data: DiscordData): Promise<DiscordData> {
    const user: DiscordData = {
      id: data.id,
      username: data.username,
      avatar: data.avatar,
      discriminator: data.discriminator,
      guild: data.guild ?? null,
    };

    this.users.set(user.id, user);

    return user;
  }

  async findById(id: string): Promise<DiscordData | null> {
    return this.users.get(id) ?? null;
  }
}
