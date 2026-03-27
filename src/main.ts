import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Global prefix ─────────────────────────────────────
  // All routes will be prefixed with /api  e.g. /api/auth/login
  app.setGlobalPrefix('api');

  // ── Validation pipe ───────────────────────────────────
  // Runs class-validator on every incoming DTO automatically.
  // whitelist: strips properties not in the DTO (protects against mass assignment)
  // forbidNonWhitelisted: throws 400 if unknown properties are sent
  // transform: auto-converts plain objects to DTO class instances
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── CORS ─────────────────────────────────────────────
  // Allow the React dev server (port 5173 for Vite) to call the API
  app.enableCors({
    origin: [
      'http://localhost:5173', // Vite dev server
      'http://localhost:3001', // alternate frontend port
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`\n🚀 Taba3ni API running on http://localhost:${port}/api`);
  console.log(`   Auth:  POST http://localhost:${port}/api/auth/login`);
  console.log(`   Users: GET  http://localhost:${port}/api/users`);
  console.log(`   Env:   ${process.env.NODE_ENV ?? 'development'}\n`);
}

bootstrap();
