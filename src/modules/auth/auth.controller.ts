import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── POST /auth/login ──────────────────────────────────
  // Public — no guard. Returns { accessToken, user }
  // Frontend stores accessToken in useAuthStore (Zustand)

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ── GET /auth/me ──────────────────────────────────────
  // Protected. Re-fetches the current user from DB using the JWT.
  // Useful on app load to verify the token is still valid
  // and refresh the user data in useAuthStore.

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: any) {
    return this.authService.validatePayload(user.id);
  }

  // ── POST /auth/logout ─────────────────────────────────
  // JWT is stateless — logout is handled client-side by clearing
  // the token from Zustand. This endpoint exists as a clean hook
  // for future refresh-token blacklisting or audit logging.

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  logout() {
    // Client clears the token from useAuthStore on receipt of 204
    return;
  }
}