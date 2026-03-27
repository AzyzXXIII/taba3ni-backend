import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/user.module';
import { User } from './modules/users/entities/user.entity';

@Module({
  imports: [
    // ── Config ──────────────────────────────────────────
    // Load .env globally — isGlobal means no need to import ConfigModule
    // in every feature module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ── Database ─────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: +config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true, // ← dev only, use migrations in production
      }),
      inject: [ConfigService],
    }),
    // ── Feature modules ───────────────────────────────────
    AuthModule,
    UsersModule,

    // Future modules — add here as they are built:
    // ProductsModule,
    // OrdersModule,
    // DeliveriesModule,
    // InvoicesModule,
  ],
})
export class AppModule {}
