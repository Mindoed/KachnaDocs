import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, type QueryResult, type QueryResultRow } from 'pg';

import { MIGRATIONS } from './migrations.js';

/**
 * The API's one PostgreSQL pool, plus the boot-time migration runner.
 *
 * The API boots fine without DATABASE_URL — most of it (auth, users, serving
 * the SPA) does not need a database — and only the features that do report a
 * 503 when used. Dropping the app to a crash-loop because a volume did not
 * mount is worse than one degraded feature.
 */
@Injectable()
export class DatabaseService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool | null;

  constructor(config: ConfigService) {
    const connectionString = config.get<string>('DATABASE_URL');
    this.pool = connectionString ? new Pool({ connectionString }) : null;
  }

  get enabled(): boolean {
    return this.pool !== null;
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: readonly unknown[],
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new ServiceUnavailableException(
        'DATABASE_URL is not set; this feature needs PostgreSQL (see infra/docker-compose.yml).',
      );
    }

    return this.pool.query<T>(text, params as unknown[]);
  }

  async onApplicationBootstrap(): Promise<void> {
    if (!this.pool) {
      this.logger.warn('DATABASE_URL not set — document features are disabled.');
      return;
    }

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name       text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const applied = new Set(
      (await this.pool.query<{ name: string }>('SELECT name FROM schema_migrations')).rows.map(
        (row) => row.name,
      ),
    );

    for (const migration of MIGRATIONS) {
      if (applied.has(migration.name)) continue;

      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(migration.sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [
          migration.name,
        ]);
        await client.query('COMMIT');
        this.logger.log(`Applied migration ${migration.name}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }
}
