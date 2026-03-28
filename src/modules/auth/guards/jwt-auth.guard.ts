import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { JwtUser } from '../../../common/interfaces/jwt-user.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // ✅ Fix #1: typed handleRequest — no more any
  handleRequest<T extends JwtUser>(err: Error | null, user: T | false): T {
    if (err || !user) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}
