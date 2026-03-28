// src/modules/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger'; // ← Add these
import { UsersService, SafeUser } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/enums/role.enum';
import { UserStatus } from '../../common/enums/user-status.enum';
import type { JwtUser } from '../../common/interfaces/jwt-user.interface';

@ApiTags('users')  // Groups all user endpoints under "users" tag
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()  // All endpoints in this controller require authentication
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── GET /users  (admin only) ──────────────────────────
  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ 
    summary: 'Get all users', 
    description: 'Retrieve a list of all users. Admin only.' 
  })
  @ApiQuery({ name: 'role', required: false, enum: Role, description: 'Filter by user role' })
  @ApiQuery({ name: 'status', required: false, enum: UserStatus, description: 'Filter by account status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, email, phone, or city' })
  @ApiResponse({ status: 200, description: 'List of users retrieved successfully', type: [Object] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  findAll(
    @Query('role') role?: Role,
    @Query('status') status?: UserStatus,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({ role, status, search });
  }

  // ── GET /users/me  (any authenticated user) ───────────
  @Get('me')
  @ApiOperation({ 
    summary: 'Get current user profile', 
    description: 'Get the profile of the authenticated user' 
  })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@CurrentUser() user: JwtUser) {
    return this.usersService.findOne(user.id);
  }

  // ── GET /users/:id  (admin only) ──────────────────────
  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ 
    summary: 'Get user by ID', 
    description: 'Get a specific user by their ID. Admin only.' 
  })
  @ApiParam({ name: 'id', description: 'User UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  // ── POST /users  (admin only) ─────────────────────────
  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new user', 
    description: 'Create a new user account. Admin only.' 
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  // ── PATCH /users/:id  (admin only) ───────────────────
  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ 
    summary: 'Update user', 
    description: 'Update user information. Admin only.' 
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  // ── PATCH /users/me/profile  (any authenticated user) ─
  @Patch('me/profile')
  @ApiOperation({ 
    summary: 'Update own profile', 
    description: 'Update your own profile information' 
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateOwnProfile(@CurrentUser() user: JwtUser, @Body() dto: UpdateUserDto) {
    // Strip role/status — users can't promote themselves
    const { role: _role, status: _status, ...safeDto } = dto;
    return this.usersService.update(user.id, safeDto);
  }

  // ── PATCH /users/:id/password  (admin only) ──────────
  @Patch(':id/password')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Change user password', 
    description: 'Change a user\'s password. Admin only.' 
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 204, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  @ApiResponse({ status: 404, description: 'User not found' })
  changePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(id, dto);
  }

  // ── PATCH /users/:id/toggle-status  (admin only) ─────
  @Patch(':id/toggle-status')
  @Roles(Role.ADMIN)
  @ApiOperation({ 
    summary: 'Toggle user status', 
    description: 'Activate or deactivate a user account. Admin only.' 
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User status updated' })
  @ApiResponse({ status: 403, description: 'Cannot deactivate admin account' })
  @ApiResponse({ status: 404, description: 'User not found' })
  toggleStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.toggleStatus(id);
  }

  // ── DELETE /users/:id  (admin only) ──────────────────
  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete user', 
    description: 'Permanently delete a user account. Admin only.' 
  })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 403, description: 'Cannot delete admin account' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.hardDelete(id);
  }
}