/**
 * Discord OAuth2 and user-API client.
 *
 * No persistence anywhere in this module, by design: an authorization code is
 * exchanged for tokens, the tokens are used immediately against the user API,
 * and the resulting JSON is returned to the caller. Nothing is written to disk
 * or a database.
 *
 * `client_secret` is required for the exchange. That is precisely why this has
 * to run server-side — a browser cannot perform it without shipping the secret
 * to the client.
 */

import { randomBytes } from 'node:crypto';
import type { APIPartialGuild, APIUser } from 'discord-api-types/v10';
import { config } from './config.ts';

/* ------------------------------------------------------------------ *
 * JSON shapes
 *
 * Discord answers with JSON we do not control — and a proxy in front of it can
 * answer with HTML. So bodies stay loose ({@link JsonObject}) and the few
 * shapes we actually read get an interface plus a narrowing helper rather than
 * a cast at every call site.
 * ------------------------------------------------------------------ */

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

/** Token response from /oauth2/token. Only `access_token` is guaranteed. */
export interface DiscordTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

/**
 * One proxied user-API call, status included so a 403 is data, not a failure.
 *
 * `body` is whatever Discord sent: an object for /users/@me, an array for
 * /users/@me/guilds. Use {@link asGuildList} / {@link asUser} to read it.
 */
export interface ApiResponse {
  ok: boolean;
  status: number;
  body: JsonValue | null;
}

export type Identity = {
  me: ApiResponse;
  guilds: ApiResponse;
  connections: ApiResponse;
};

export interface AuthorizeUrl {
  url: string;
  /** Present only when PKCE is enabled; the caller needs it for the exchange. */
  verifier: string | null;
}

/** Error carrying an HTTP status so the server layer can map it directly. */
export class HttpError extends Error {
  readonly status: number;
  /** Structured context sent to the client alongside `message`. */
  readonly details: JsonObject | undefined;

  /** `details` may be an Error whose own `details` are carried forward. */
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = asObject(details instanceof Error ? (details as { details?: unknown }).details : details);
  }
}

function base64Url(buf: Uint8Array): string {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** URL-safe random string, used for OAuth2 `state` and the PKCE verifier. */
export function randomToken(bytes = 32): string {
  return base64Url(randomBytes(bytes));
}

async function sha256UrlSafe(text: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return base64Url(new Uint8Array(digest));
}

/**
 * Build the Discord authorization URL.
 *
 * `state` is our own anti-CSRF value, validated on the way back. Discord does
 * not require it, but without it a stranger can complete a login into your
 * browser session.
 *
 * PKCE is off by default. A portal "Web" application uses the code flow with
 * `client_secret` and no PKCE, and adding `code_challenge` to that request is
 * itself a mismatch error — so a non-web app type needs DISCORD_USE_PKCE=true.
 */
export async function buildAuthorizeUrl(state: string): Promise<AuthorizeUrl> {
  const { clientId, redirectUri, scopes, endpoints } = config.discord;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    state,
    // `bot` would be added here only if the app also needs a bot token; that
    // changes what /users/@me/guilds means, so it is off unless asked for.
  });

  if (config.discord.usePkce) {
    const verifier = randomToken(64);
    params.set('code_challenge', await sha256UrlSafe(verifier));
    params.set('code_challenge_method', 'S256');
    // Returned so the caller can stash the verifier for the token request.
    return { url: `${endpoints.authorize}?${params}`, verifier };
  }

  return { url: `${endpoints.authorize}?${params}`, verifier: null };
}

/**
 * Exchange an authorization code for an access token.
 *
 * Discord expects application/x-www-form-urlencoded here, matching RFC 6749.
 * JSON is rejected.
 */
export async function exchangeCode(code: string, verifier: string | null): Promise<DiscordTokenResponse> {
  const { clientId, clientSecret, redirectUri } = config.discord;
  requireCredentials();

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });
  if (verifier) body.set('code_verifier', verifier);

  return postTokenRequest(body, 'Token exchange failed');
}

/**
 * Exchange a refresh token for a fresh access token.
 *
 * Present because it is one of the reasons a backend exists at all: refreshing
 * needs `client_secret`, which must never reach a browser.
 */
export async function refreshTokens(refreshToken: string): Promise<DiscordTokenResponse> {
  const { clientId, clientSecret } = config.discord;
  requireCredentials();

  return postTokenRequest(
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
    'Token refresh failed',
  );
}

async function postTokenRequest(body: URLSearchParams, label: string): Promise<DiscordTokenResponse> {
  const response = await fetch(config.discord.endpoints.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const payload = await readJson(response);

  if (!response.ok) {
    // Discord reports OAuth failures as { error, error_description, state }, but
    // a proxy in front of it may answer with anything, so narrow before reading.
    const failure = asObject(payload);
    throw new HttpError(502, label, {
      discord_error: asString(failure?.error) ?? `http_${response.status}`,
      discord_description: asString(failure?.error_description) ?? null,
      // 31013 is a redirect_uri mismatch — by far the most common failure and
      // the reason the code is reported rather than swallowed.
      discord_code: failure?.code ?? null,
      http_status: response.status,
    });
  }

  // A 2xx body that does not match the documented shape stays a caller problem,
  // exactly as it was when this module was untyped. `access_token` is the one
  // field read afterwards; a missing one reads as undefined at the call site.
  return (payload ?? {}) as unknown as DiscordTokenResponse;
}

/**
 * One call to a Discord user-API endpoint.
 *
 * Returns `{ ok, status, body }` rather than throwing on a non-2xx, because in
 * an identity viewer a 403 (missing scope) is itself interesting data — the
 * caller wants to see that the scope was absent, not an error page.
 */
export async function callUserApi(accessToken: string, path: string): Promise<ApiResponse> {
  const response = await fetch(`${config.discord.endpoints.api}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return {
    ok: response.ok,
    status: response.status,
    body: await readJson(response),
  };
}

/**
 * Fetch the identity surface in parallel.
 *
 * Scopes are unknown to us at runtime, so each endpoint is attempted and its
 * status reported. A missing scope shows up as 403 with Discord's own message,
 * which is far more useful than us guessing which scopes were granted.
 *
 * CAVEAT: if this application was created with a bot token and bot scopes,
 * /users/@me/guilds can reflect guilds the *application* is in rather than the
 * ones the authorizing user sees. Check `application_id` correlation before
 * treating that list as "my servers".
 */
export async function fetchIdentity(accessToken: string): Promise<Identity> {
  const [me, guilds, connections] = await Promise.all([
    callUserApi(accessToken, '/users/@me'),
    callUserApi(accessToken, '/users/@me/guilds'),
    callUserApi(accessToken, '/users/@me/connections'),
  ]);

  return { me, guilds, connections };
}

/**
 * The `body` of a /users/@me/guilds call, when it really is the array Discord
 * documents. 0.38 of discord-api-types has no dedicated user-guild type;
 * APIPartialGuild is what that endpoint returns.
 */
export function asGuildList(response: ApiResponse | undefined): APIPartialGuild[] {
  return Array.isArray(response?.body) ? (response.body as unknown as APIPartialGuild[]) : [];
}

/** The `body` of a /users/@me call, or null when that call did not succeed. */
export function asUser(response: ApiResponse | undefined): APIUser | null {
  const body = response?.body;
  return body && !Array.isArray(body) && typeof body === 'object'
    ? (body as unknown as APIUser)
    : null;
}

function requireCredentials(): void {
  if (config.ready) return;
  const missing: string[] = [];
  if (!config.discord.clientId) missing.push('DISCORD_CLIENT_ID');
  if (!config.discord.clientSecret) missing.push('DISCORD_CLIENT_SECRET');
  throw new HttpError(503, 'Backend is not configured', {
    missing_env: missing,
    hint: 'Copy backend/.env.example to backend/.env and fill in the values.',
  });
}

/**
 * Discord can return JSON; a proxy or HTML error page cannot be parsed.
 *
 * The parsed value is passed through unchanged — /users/@me answers with an
 * object but /users/@me/guilds with an array, and flattening either into an
 * object shape loses data. Only genuinely unparseable bodies become a marker.
 */
async function readJson(response: Response): Promise<JsonValue | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    // JSON.parse can only yield JsonValue, so the cast states the guarantee
    // rather than assume it.
    return JSON.parse(text) as JsonValue;
  } catch {
    return {
      unparseable: true,
      content_type: response.headers.get('content-type'),
      raw: text.slice(0, 2000),
    };
  }
}

/* ------------------------------------------------------------------ *
 * Narrowing helpers
 * ------------------------------------------------------------------ */

function asObject(value: unknown): JsonObject | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonObject)
    : undefined;
}

function asString(value: JsonValue | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
