import { Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import passport from 'passport';
import {
  Strategy,
  DiscordScope,
  type ConsumableAPI,
  type DiscordProfile,
  type VerifyCallback,
} from 'discord-strategy';
import { AuthService } from './auth.service.js';

@Injectable()
export class DiscordStrategy extends Strategy implements OnModuleInit {
  private readonly logger = new Logger(DiscordStrategy.name);

  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super(
      {
        // Required by DiscordStrategyOptions' base type, although
        // discord-strategy defaults to exactly these endpoints.
        authorizationURL: 'https://discord.com/oauth2/authorize',
        tokenURL: 'https://discord.com/api/oauth2/token',
        clientID: config.getOrThrow<string>('DISCORD_CLIENT_ID'),
        clientSecret: config.getOrThrow<string>('DISCORD_CLIENT_SECRET'),
        callbackURL: config.getOrThrow<string>('DISCORD_CALLBACK_URL'),
        scope: [DiscordScope.Identify, DiscordScope.Guilds],
        state: true,
      },
      (
        _accessToken: string,
        _refreshToken: string,
        _profile: DiscordProfile,
        verified: VerifyCallback,
        consume: ConsumableAPI,
      ) => {
        void this.validate(verified, consume);
      },
    );
  }

  // Registered manually instead of via PassportStrategy(): that mixin
  // treats the verify callback's LAST argument as passport's `done`, but
  // discord-strategy always appends `consume` after `verified`, which
  // would make the wrapper call `consume(null, result)` and crash.
  onModuleInit(): void {
    passport.use('discord', this);
  }

  private async validate(verified: VerifyCallback, consume: ConsumableAPI): Promise<void> {
    try {
      const guildId = this.config.getOrThrow<string>('DISCORD_GUILD_ID');

      await Promise.all([
        consume.guilds(),
        // possible to fetch more data about the user
      ]);

      const profile = consume.profile();

      this.logger.debug(`Guilds: ${JSON.stringify(profile.guilds, null, 2)}`);

      const member = profile.member?.[guildId];
      if (!member) {
        return verified(new UnauthorizedException('Not a member of the required Discord guild'));
      }

      const user = await this.authService.findOrCreateDiscordUser(profile);

      // Fall back to the raw profile until upsertDiscordUser
      // returns a persisted user — passport fails the login on a
      // falsy user.
      verified(null, user ?? profile);
    } catch (error) {
      verified(
        error instanceof Error ? error : new Error('Discord membership verification failed'),
      );
    }
  }
}
