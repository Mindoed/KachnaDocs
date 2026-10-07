/**
 * KachnaDocs backend.
 *
 * Deliberately bare: `node:http` with a hand-rolled route table rather than a
 * framework, because the whole job is four endpoints that move JSON around.
 * Responses are `text/plain` pretty-printed JSON, so the browser is the JSON
 * viewer and there is no UI to maintain yet.
 *
 * Nothing is persisted. OAuth2 `state` and the PKCE verifier live in a temporary
 * cookie on the caller's browser — they must survive the redirect round-trip,
 * and a cookie is the only place available that does, without us keeping server
 * session state. The cookie is HttpOnly and SameSite=Lax, which is what the
 * cross-site redirect back from Discord requires in practice.
 *
 * Endpoints
 *   GET  /              usage
 *   GET  /health        configuration status, no secrets
 *   GET  /login         begin the OAuth2 flow
 *   GET  /callback      complete it and return the identity JSON
 *   GET  /identity      identity from a refresh token passed by the caller
 *   POST /identity      identity from an access token passed by the caller
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { config } from './config.ts';
import {
  HttpError,
  asGuildList,
  asUser,
  buildAuthorizeUrl,
  exchangeCode,
  fetchIdentity,
  randomToken,
  type JsonObject,
} from './discord.ts';

const COOKIE_MAX_AGE = 600; // seconds; the flow should complete in well under this

const server = createServer((req, res) => {
  handle(req, res).catch((error: unknown) => {
    // Last resort: a thrown error must still produce a parseable response
    // rather than a hung connection or an HTML stack trace.
    const status = error instanceof HttpError ? error.status : 500;
    writeJson(res, status, {
      error: status === 500 ? 'internal_error' : 'request_failed',
      message: error instanceof Error ? error.message : String(error),
      ...(error instanceof HttpError ? error.details ?? {} : {}),
    });
  });
});

server.listen(config.port, () => {
  console.log(`KachnaDocs backend on http://localhost:${config.port}`);
  console.log(`  redirect URI Discord expects: ${config.discord.redirectUri}`);
  console.log(`  credentials: ${config.ready ? 'loaded' : 'MISSING — copy .env.example to .env'}`);
});

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', config.publicOrigin);

  switch (`${req.method} ${url.pathname}`) {
    case 'GET /':
      return sendText(res, 200, usage());

    case 'GET /health':
      return writeJson(res, 200, {
        ok: true,
        configured: config.ready,
        client_id_set: Boolean(config.discord.clientId),
        // Never log or echo client_secret. Presence, not value.
        client_secret_set: Boolean(config.discord.clientSecret),
        redirect_uri: config.discord.redirectUri,
        scopes: config.discord.scopes,
        node: process.version,
      });

    case 'GET /login':
      return startLogin(res);

    case 'GET /callback':
      return completeLogin(req, res);

    case 'POST /identity':
      return identityFromAccessToken(req, res);

    default:
      return writeJson(res, 404, {
        error: 'not_found',
        message: `No route for ${req.method} ${url.pathname}`,
        routes: ['GET /', 'GET /health', 'GET /login', 'GET /callback', 'POST /identity'],
      });
  }
}

/**
 * Begin the flow. Discord needs `state`; we need to check it on return, so it
 * goes into a cookie scoped to the callback.
 */
async function startLogin(res: ServerResponse): Promise<void> {
  const state = randomToken(24);
  const { url, verifier } = await buildAuthorizeUrl(state);

  const cookies = [cookie('kd_state', state), verifier ? cookie('kd_verifier', verifier) : null];
  res.writeHead(302, {
    Location: url,
    'Set-Cookie': cookies.filter((c): c is string => c !== null),
  });
  res.end();
}

/**
 * Complete the flow.
 *
 * Discord returns either `code` and `state`, or `error` and `state`. Both are
 * handled, and a Discord-side error is reported verbatim — seeing the exact
 * error (31013 redirect mismatch, "invalid scope", etc.) is the point of this
 * stage of the project.
 */
async function completeLogin(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', config.publicOrigin);
  const cookies = readCookies(req);

  const returnedState = url.searchParams.get('state') ?? '';
  const expectedState = cookies['kd_state'] ?? '';

  // Constant-shape comparison is not needed for a value the attacker already
  // sees in their own redirect, but absence and mismatch are distinct problems
  // and are reported distinctly.
  if (!expectedState) {
    throw new HttpError(400, 'Missing state cookie', {
      hint: 'Open /login in this same browser so the state cookie is set.',
    });
  }
  if (returnedState !== expectedState) {
    throw new HttpError(400, 'State mismatch', {
      hint: 'Possible CSRF, or the flow was started in a different browser/session.',
    });
  }

  const oauthError = url.searchParams.get('error');
  if (oauthError) {
    throw new HttpError(400, 'Discord rejected the authorization request', {
      discord_error: oauthError,
      discord_description: url.searchParams.get('error_description'),
    });
  }

  const code = url.searchParams.get('code');
  if (!code) throw new HttpError(400, 'No authorization code in callback');

  const tokens = await exchangeCode(code, cookies['kd_verifier'] ?? null);
  const identity = await fetchIdentity(tokens.access_token);

  // Tokens are cleared rather than returned. Returning them would put a live
  // bearer token in the browser, where any later script or extension could read
  // it; this endpoint's caller only needs the identity JSON.
  clearFlowCookies(res);

  // The guilds call may have failed or returned nothing, so asGuildList gives []
  // and the user is treated as a non-member rather than crashing the callback.
  const guilds = asGuildList(identity.guilds);
  const suGuild = guilds.find((guild) => guild.id === config.discord.guildId) ?? null;

  return writeJson(res, 200, {
    is_member_of_SU: suGuild !== null,
    stage: 'identity',
    // What was granted, as reported by Discord itself rather than inferred.
    granted_scope: tokens.scope ?? null,
    token_type: tokens.token_type ?? null,
    expires_in: tokens.expires_in ?? null,
    refresh_token_present: Boolean(tokens.refresh_token),
    identity: {
      me: asUser(identity.me),
      su_guild: suGuild,
    },
  });
}

/**
 * Identity from an access token the caller already holds.
 *
 * Exists so you can test the identity shape without re-running the whole
 * browser flow every time: paste a token, get JSON.
 */
async function identityFromAccessToken(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  let accessToken: unknown;
  try {
    accessToken = (JSON.parse(body || '{}') as JsonObject).access_token;
  } catch {
    throw new HttpError(400, 'Request body must be JSON', {
      hint: 'Send {"access_token": "..."}',
    });
  }
  if (typeof accessToken !== 'string' || !accessToken) {
    throw new HttpError(400, 'access_token is required');
  }

  const identity = await fetchIdentity(accessToken);
  return writeJson(res, 200, { stage: 'identity', source: 'posted_token', identity });
}

function usage(): string {
  const lines = [
    'KachnaDocs backend — Discord OAuth2 identity, no persistence.',
    '',
    'Configure: copy backend/.env.example to backend/.env, then restart.',
    'Register this redirect URI in the Discord Developer Portal:',
    `    ${config.discord.redirectUri}`,
    '',
    'Flow:',
    '    GET /login      redirect to Discord',
    '    GET /callback   returns identity JSON as text',
    '',
    'Manual:',
    '    POST /identity  {"access_token": "..."} -> identity JSON',
    '    GET  /health    configuration status',
    '',
    'Endpoints fetched once a token exists:',
    '    /users/@me               scope identify',
    '    /users/@me/guilds        scope guilds',
    '    /users/@me/connections   scope connections',
    '',
    config.ready
      ? 'Status: configured.'
      : 'Status: NOT configured — /login and /callback will return 503.',
  ];
  return lines.join('\n');
}

/* ------------------------------------------------------------------ *
 * HTTP helpers
 * ------------------------------------------------------------------ */

function writeJson(res: ServerResponse, status: number, value: unknown): void {
  sendText(res, status, JSON.stringify(value, null, 2));
}

function sendText(res: ServerResponse, status: number, text: string): void {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
    'Cache-Control': 'no-store',
  });
  res.end(text);
}

function cookie(name: string, value: string): string {
  return (
    `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; ` +
    `Max-Age=${COOKIE_MAX_AGE}`
  );
}

function clearFlowCookies(res: ServerResponse): void {
  res.setHeader('Set-Cookie', [cookie('kd_state', ''), cookie('kd_verifier', '')].map(removeExpired));
}

function removeExpired(c: string): string {
  return c.replace(/Max-Age=\d+/, 'Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
}

function readCookies(req: IncomingMessage): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    if (name) out[name] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

/** Bounded read: a stray large upload should not exhaust memory. */
function readBody(req: IncomingMessage, limit = 64 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) {
        reject(new HttpError(413, 'Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
