// src/modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'; // ← Add these
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/interfaces/jwt-user.interface';

@ApiTags('auth')  // Groups all auth endpoints under "auth" tag
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'User login', 
    description: 'Authenticate user and return JWT access token' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful. Returns access token and user data.',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Admin User',
          email: 'admin@taba3ni.tn',
          role: 'admin',
          status: 'active'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'User registration', 
    description: 'Create a new user account' 
  })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()  // Indicates this endpoint requires JWT token
  @ApiOperation({ 
    summary: 'Get current user', 
    description: 'Get the profile of the authenticated user' 
  })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@CurrentUser() user: JwtUser) {
    return this.authService.validatePayload(user.id);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'User logout', 
    description: 'Logout (client clears token)' 
  })
  @ApiResponse({ status: 204, description: 'Logout successful' })
  logout(): void {
    // Client clears token from store; hook for future refresh-token blacklisting
  }
}
