import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

import { DiscordProfile } from 'discord-strategy';

@Injectable()
export class UsersService {
  constructor(private readonly config: ConfigService) {}

  upsertDiscordUser(profile: DiscordProfile) {
    // Implementation for upserting a Discord user goes here
  }
}
