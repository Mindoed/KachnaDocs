import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync } from 'fs';
import { extname, join } from 'path';
import type { NextFunction, Request, Response } from 'express';

import session from 'express-session';
import passport from 'passport';
import { normalizeBasePath } from './common/base-path.js';

async function bootstrap() {
  // 1. Cast the application to NestExpressApplication to unlock Express utilities
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');

  // Trust the single proxy hop in front of us (Caddy/Traefik/nginx terminating
  // TLS), so req.protocol and req.host report what the browser used rather than
  // the loopback address we were reached on. Two things depend on it:
  //   - the OAuth callback URL, which discord-strategy resolves against the
  //     request origin when DISCORD_CALLBACK_URL is relative;
  //   - the postMessage target on the login popup's final page
  //     (auth.controller.ts).
  // Without it both come out as http://<internal host>, and the browser silently
  // drops a message addressed to http:// from an https page.
  //
  app.set('trust proxy', 1);

  const config = app.get(ConfigService);
  const isProduction = config.get<string>('NODE_ENV') === 'production';
  const logger = new Logger('Bootstrap');

  // Where the proxy in front of us mounts us: '/kachnadocs' for a site at
  // https://example.com/kachnadocs/, '' for the origin root. The SPA has to be
  // built for the same value (VITE_BASE_PATH, apps/web/vite.config.ts) because
  // its asset URLs are baked in; this only has to agree with the proxy about
  // whether the prefix survives into the request we see — see the middleware
  // below, which copes with either.
  const basePath = normalizeBasePath(config.get<string>('BASE_PATH'));

  app.use(
    session({
      secret: config.getOrThrow<string>('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // 3. Serve Vue static files when deployed in the single Docker container
  if (isProduction) {
    const clientPath = join(process.cwd(), 'apps', 'api', 'client');
    const indexHtml = join(clientPath, 'index.html');

    // Refuse to start rather than serve a shell whose assets 404. Every request
    // still reaches a handler when this directory is missing, so the symptom from
    // the outside is a page of 404s for /assets/* — a bug report, not a crash log.
    if (!existsSync(indexHtml)) {
      throw new Error(
        `NODE_ENV=production but ${indexHtml} does not exist. Stage 4 of the Dockerfile ` +
          'copies the Vite build there (COPY --from=web-builder ... ./apps/api/client) and ' +
          'process.cwd() has to be /app, so either the image was built without the web ' +
          'stage output or the container starts from another working directory.',
      );
    }

    if (basePath) {
      // A proxy mounts an app in one of two ways: it forwards the prefix verbatim,
      // or it strips it (Caddy's handle_path). Dropping it here when it is present
      // makes both look identical to everything below — the static handler, the
      // 'api' global prefix and the fallback all speak root-relative. A proxy that
      // already stripped it never matches, so this is a no-op there.
      app.use((req: Request, _res: Response, next: NextFunction) => {
        if (req.url === basePath || req.url.startsWith(`${basePath}/`)) {
          req.url = req.url.slice(basePath.length) || '/';
        }
        next();
      });
    }

    // Serve static files (js, css, images)
    app.useStaticAssets(clientPath);

    // Fallback handler for Vue Router History Mode: any path that is not a real
    // file belongs to the SPA, which decides what it means. Narrow on purpose, in
    // three ways — GET/HEAD only, never the API, never a path with a file
    // extension. A blanket fallback answers a genuinely missing
    // /assets/index-<hash>.js with index.html, and the browser reports that as
    // "expected MIME type text/javascript, got text/html" over a blank page: the
    // same failure as a 404, only without the URL that names the missing file.
    app.use((req: Request, res: Response, next: NextFunction) => {
      const pathname = (req.url.split('?')[0] ?? '/').replace(/\/+$/, '') || '/';
      if (
        (req.method !== 'GET' && req.method !== 'HEAD') ||
        pathname.startsWith('/api') ||
        extname(pathname)
      ) {
        return next();
      }

      res.sendFile(indexHtml, (err?: unknown) => (err ? next(err) : undefined));
    });

    logger.log(`Serving SPA from ${clientPath}` + (basePath ? `, mounted at ${basePath}/` : ''));
  }

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
