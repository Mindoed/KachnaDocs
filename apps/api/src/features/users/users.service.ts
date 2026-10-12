import { Injectable } from '@nestjs/common';
import type { DiscordProfile } from 'discord-strategy';

export interface AppUser {
  id: string;
  username: string;
  avatar?: string | null;
}

@Injectable()
export class UsersService {
  private readonly users = new Map<string, AppUser>();

  async upsertDiscordUser(profile: DiscordProfile): Promise<AppUser> {
    const user: AppUser = {
      id: profile.id,
      username: profile.username,
      avatar: profile.avatar,
    };

    this.users.set(user.id, user);

    return user;
  }

  async findById(id: string): Promise<AppUser | null> {
    return this.users.get(id) ?? null;
  }
}
