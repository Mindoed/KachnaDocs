import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  serializeUser(user: { id: string }, done: (error: Error | null, id?: string) => void) {
    done(null, user.id);
  }

  async deserializeUser(id: string, done: (error: Error | null, user?: unknown) => void) {
    try {
      const user = await this.usersService.findById(id);

      done(null, user ?? false);
    } catch (error) {
      done(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
