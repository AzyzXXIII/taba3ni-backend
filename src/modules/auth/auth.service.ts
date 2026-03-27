import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // ── Login ─────────────────────────────────────────────
  // Called by POST /auth/login
  // Returns the JWT + a safe user object (no password)

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

    // 3. Verify password
    const passwordValid = await user.validatePassword(dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 4. Update last login timestamp (fire and forget — no need to await)
    this.usersService.updateLastLogin(user.id).catch(() => null);

    // 5. Sign the JWT
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // 6. Return token + safe user info
    // The frontend useAuthStore will store this
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
        storeName: user.storeName,   // relevant for client role
        vehicle: user.vehicle,       // relevant for distributor role
        zones: user.zones,           // relevant for distributor role
      },
    };
  }

  // ── Validate token payload ────────────────────────────
  // Used internally by JwtStrategy — confirms user still exists and is active

  async validatePayload(id: string) {
    return this.usersService.findOne(id);
  }
}