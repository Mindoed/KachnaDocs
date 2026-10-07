/**
 * Runtime configuration.
 *
 * Everything comes from environment variables, read from `backend/.env` if it
 * exists. `.env` is git-ignored (see root `.gitignore`); `.env.example` is the
 * template to copy and fill in.
 *
 * The redirect URI must match, character for character, one of the OAuth2
 * redirect URIs registered for the application in the Discord Developer Portal.
 * A mismatch makes Discord reject the authorization request before it ever
 * reaches us, with error 31013 ("redirect_uri mismatch").
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = join(HERE, '..');

export interface DiscordEndpoints {
  authorize: string;
  token: string;
  api: string;
}

export interface DiscordConfig {
  clientId: string;
  clientSecret: string;
  guildId: string;
  redirectUri: string;
  scopes: string;
  /** A portal "Web" app must keep this false; see `buildAuthorizeUrl`. */
  usePkce: boolean;
  endpoints: DiscordEndpoints;
}

export interface Config {
  port: number;
  publicOrigin: string;
  discord: DiscordConfig;
  /** False when credentials are absent; endpoints then answer 503 instead of crashing. */
  ready: boolean;
}

/**
 * Minimal dotenv reader. Deliberately not a dependency: we need KEY=value and
 * nothing else, and a parser small enough to read in one screen is worth more
 * than the flexibility we would not use.
 *
 * Supports: blank lines, `#` comments, optional `export ` prefix, single or
 * double quoted values, and inline quotes stripped from the whole value.
 * Does not support variable interpolation or multi-line values.
 */
function parseDotenv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim().replace(/^export\s+/, '');
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;

    let value = line.slice(eq + 1).trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.endsWith(quote) && value.length > 1) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function load(): Config {
  // Two independent precedence rules:
  //   among files, later outranks earlier  (.env.local > .env)
  //   a real process variable outranks both, so a deployed value is never
  //   shadowed by a stale local file
  // An empty-string process variable counts as "set" and is left alone.
  const fromFiles: Record<string, string> = {};
  for (const name of ['.env', '.env.local']) {
    const path = join(BACKEND_ROOT, name);
    if (existsSync(path)) Object.assign(fromFiles, parseDotenv(readFileSync(path, 'utf8')));
  }

  const env: Record<string, string | undefined> = { ...fromFiles, ...process.env };

  const port = Number.parseInt(env.PORT ?? '8787', 10);
  const clientId = env.DISCORD_CLIENT_ID ?? '';
  const clientSecret = env.DISCORD_CLIENT_SECRET ?? '';
  const redirectUri = env.DISCORD_REDIRECT_URI ?? 'http://localhost:8787/callback';
  const publicOrigin = env.PUBLIC_ORIGIN ?? `http://localhost:${port}`;
  const guildId = env.DISCORD_GUILD_ID ?? '';
  const usePkce = /^(?:1|true|yes)$/i.test(env.DISCORD_USE_PKCE ?? 'false');

  // Absent credentials are a supported state, not a crash: the server starts so
  // you can see what is missing instead of getting a stack trace. `token` will
  // return a 503 naming the variables.
  return {
    port,
    publicOrigin,
    discord: {
      clientId,
      clientSecret,
      guildId,
      redirectUri,
      scopes: env.DISCORD_SCOPES ?? 'identify guilds',
      usePkce,
      endpoints: {
        authorize: 'https://discord.com/oauth2/authorize',
        token: 'https://discord.com/api/v10/oauth2/token',
        api: 'https://discord.com/api/v10',
      },
    },
    ready: Boolean(clientId && clientSecret),
  };
}

export const config: Config = load();
