import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Strategy, ExtractJwt } = require('passport-jwt') as typeof import('passport-jwt');
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import type { JwtUser } from '../../../common/interfaces/jwt-user.interface';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtUser> {
    const user = await this.usersService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (user.status === 'inactive') {
      throw new UnauthorizedException('Account is deactivated');
    }

    return { id: user.id, email: user.email, role: user.role, name: user.name };
  }
}
