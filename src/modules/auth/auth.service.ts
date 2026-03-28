// src/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,  // ← Add this
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';  // ← Add this
import type { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // ── Register ─────────────────────────────────────────
  async register(dto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.usersService.findByEmailWithPassword(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Create the user
    const user = await this.usersService.create(dto);

    // Generate token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Return token + safe user info
    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        city: user.city,
        phone: user.phone,
        storeName: user.storeName,
        vehicle: user.vehicle,
        zones: user.zones,
      },
    };
  }

  // ── Login ─────────────────────────────────────────────
  async login(dto: LoginDto) {
    // 1. Find user by email — needs password so we use the special method
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2. Check account is active
    if (user.status === 'inactive') {
      throw new UnauthorizedException('Your account has been deactivated. Contact an administrator.');
    }

    // 3. Verify password - Fix: Use bcrypt directly or add method to entity
    const passwordValid = await this.verifyPassword(user.password, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 4. Update last login timestamp
    this.usersService.updateLastLogin(user.id).catch(() => null);

    // 5. Sign the JWT
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // 6. Return token + safe user info
    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        city: user.city,
        phone: user.phone,
        storeName: user.storeName,
        vehicle: user.vehicle,
        zones: user.zones,
      },
    };
  }

  // ── Validate token payload ────────────────────────────
  async validatePayload(id: string) {
    return this.usersService.findOne(id);
  }

  // ── Helper to verify password ─────────────────────────
  private async verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
    const bcrypt = require('bcryptjs');
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
