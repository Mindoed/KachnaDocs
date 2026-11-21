import { Global, Module } from '@nestjs/common';

import { DatabaseService } from './database.service.js';

/** Global because documents/versions/… will all need the pool, and importing
 *  the same module into five features buys nothing over `@Global()`. */
@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
