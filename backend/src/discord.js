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
import { config } from './config.js';

/** Error carrying an HTTP status so the server layer can map it directly. */
export class HttpError extends Error {
  /** `details` may be an Error whose own `details` are carried forward. */
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details instanceof Error ? details.details : details;
  }
}

function base64Url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** URL-safe random string, used for OAuth2 `state` and the PKCE verifier. */
export function randomToken(bytes = 32) {
  return base64Url(randomBytes(bytes));
}

async function sha256UrlSafe(text) {
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
export async function buildAuthorizeUrl(state) {
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
export async function exchangeCode(code, verifier) {
  const { clientId, clientSecret, redirectUri, endpoints } = config.discord;
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
export async function refreshTokens(refreshToken) {
  const { clientId, clientSecret, endpoints } = config.discord;
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

async function postTokenRequest(body, label) {
  const response = await fetch(config.discord.endpoints.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const payload = await readJson(response);

  if (!response.ok) {
    // Discord reports OAuth failures as { error, error_description, state }.
    throw new HttpError(502, label, {
      discord_error: payload?.error ?? `http_${response.status}`,
      discord_description: payload?.error_description ?? null,
      // 31013 is a redirect_uri mismatch — by far the most common failure and
      // the reason the code is reported rather than swallowed.
      discord_code: payload?.code ?? null,
      http_status: response.status,
    });
  }

  return payload;
}

/**
 * One call to a Discord user-API endpoint.
 *
 * Returns `{ ok, status, body }` rather than throwing on a non-2xx, because in
 * an identity viewer a 403 (missing scope) is itself interesting data — the
 * caller wants to see that the scope was absent, not an error page.
 */
export async function callUserApi(accessToken, path) {
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
export async function fetchIdentity(accessToken) {
  const targets = [
    ['me', '/users/@me'],
    ['guilds', '/users/@me/guilds'],
    ['connections', '/users/@me/connections'],
  ];

  const settled = await Promise.all(
    targets.map(async ([name, path]) => [name, await callUserApi(accessToken, path)]),
  );

  return Object.fromEntries(settled);
}

function requireCredentials() {
  if (config.ready) return;
  const missing = [];
  if (!config.discord.clientId) missing.push('DISCORD_CLIENT_ID');
  if (!config.discord.clientSecret) missing.push('DISCORD_CLIENT_SECRET');
  throw new HttpError(503, 'Backend is not configured', {
    missing_env: missing,
    hint: 'Copy backend/.env.example to backend/.env and fill in the values.',
  });
}

/** Discord can return JSON; a proxy or HTML error page cannot be parsed. */
async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return {
      unparseable: true,
      content_type: response.headers.get('content-type'),
      raw: text.slice(0, 2000),
    };
  }
}
