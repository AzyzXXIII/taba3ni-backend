import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    // UsersModule is needed by AuthService and JwtStrategy
    UsersModule,

    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Register JwtModule asynchronously so we can read JWT_SECRET from .env
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    // Register guards as providers so NestJS DI can inject Reflector into RolesGuard
    JwtAuthGuard,
    RolesGuard,
  ],
  controllers: [AuthController],
  exports: [
    AuthService,
    JwtAuthGuard,
    RolesGuard,
    JwtModule, // Export so other modules can use JwtService if needed
  ],
})
export class AuthModule {}