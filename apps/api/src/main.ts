import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

import session from 'express-session';
import passport from 'passport';

async function bootstrap() {
  // 1. Cast the application to NestExpressApplication to unlock Express utilities
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');

  const config = app.get(ConfigService);
  const isProduction = process.env.NODE_ENV === 'production';

  // 2. Only enforce external CORS in development (Vite dev server)
  if (!isProduction) {
    app.enableCors({
      origin: config.getOrThrow<string>('FRONTEND_URL'),
      credentials: true,
    });
  }

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

    // Serve static files (js, css, images)
    app.useStaticAssets(clientPath);

    // Fallback handler for Vue Router History Mode
    // For non-API routes (e.g. /dashboard), return index.html so Vue handles the routing
    app.use((req: { url: string }, res: { sendFile: (arg0: string) => void }, next: () => void) => {
      if (!req.url.startsWith('/api')) {
        res.sendFile(join(clientPath, 'index.html'));
      } else {
        next();
      }
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
