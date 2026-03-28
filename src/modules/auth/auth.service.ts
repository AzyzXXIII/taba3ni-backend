import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Role } from '../../common/enums/role.enum';
import type { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmailWithPassword(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // ✅ Fix #5 (service side): always force CLIENT role on public registration.
    // Admins and distributors are created by admin via POST /users.
    const user = await this.usersService.create({
      ...dto,
      role: Role.CLIENT,
    });

    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken, user };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === 'inactive') {
      throw new UnauthorizedException('Your account has been deactivated.');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    this.usersService.updateLastLogin(user.id).catch(() => null);

    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

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

  async validatePayload(id: string) {
    return this.usersService.findOne(id);
  }
}
