// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Global prefix ─────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Validation pipe ───────────────────────────────────
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
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3001',
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ── Swagger Documentation ────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Taba3ni API')
    .setDescription(`
      Taba3ni Delivery Service API Documentation
      
      ## Authentication
      This API uses JWT Bearer tokens for authentication.
      - Login via \`POST /api/auth/login\` to get your token
      - Click the "Authorize" button below and enter: \`Bearer YOUR_TOKEN\`
      
      ## Roles
      - **Admin**: Full access to all endpoints
      - **Distributor**: Can manage deliveries
      - **Client**: Can place and track orders
    `)
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT token',
        in: 'header',
      },
      'access-token',
    )
    .addTag('auth', 'Authentication endpoints - Login, Register, Logout')
    .addTag('users', 'User management - Create, update, delete users')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,  // Keep token after page refresh
      docExpansion: 'none',        // Collapse all endpoints by default
      filter: true,                // Add search/filter input
      showRequestDuration: true,   // Show request duration
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`\n🚀 Taba3ni API running on http://localhost:${port}/api`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  console.log(`   Auth:  POST http://localhost:${port}/api/auth/login`);
  console.log(`   Users: GET  http://localhost:${port}/api/users`);
  console.log(`   Env:   ${process.env.NODE_ENV ?? 'development'}\n`);
}

bootstrap();
