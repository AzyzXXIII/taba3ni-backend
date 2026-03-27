import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

export interface JwtPayload {
  sub: string;   // user id
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  // Called automatically by Passport after token signature is verified.
  // Whatever we return here is attached to request.user
  async validate(payload: JwtPayload) {
    const user = await this.usersService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (user.status === 'inactive') {
      throw new UnauthorizedException('Account is deactivated');
    }

    // request.user will have: id, email, role (enough for guards + @CurrentUser)
    return { id: user.id, email: user.email, role: user.role, name: user.name };
  }
}