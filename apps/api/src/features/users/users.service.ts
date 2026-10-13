import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { DiscordUser } from '@kachnadocs/shared';

@Injectable()
export class UsersService {
  private readonly users = new Map<string, DiscordUser>();

  constructor(private readonly config: ConfigService) {}

  async upsertDiscordUser(data: DiscordUser): Promise<DiscordUser> {
    const user: DiscordUser = {
      id: data.id,
      username: data.username,
      avatar: data.avatar,
      discriminator: data.discriminator,
      guild: data.guild ?? null,
    };

    this.users.set(user.id, user);

    return user;
  }

  async findById(id: string): Promise<DiscordUser | null> {
    return this.users.get(id) ?? null;
  }
}
