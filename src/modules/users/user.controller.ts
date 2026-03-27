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
} from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../../common/enums/role.enum';
import { UserStatus } from '../../common/enums/user-status.enum';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard) // All /users routes require a valid JWT
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── GET /users  (admin only) ──────────────────────────
  // Supports ?role=distributor&status=active&search=ahmed

  @Get()
  @Roles(Role.ADMIN)
  findAll(
    @Query('role') role?: Role,
    @Query('status') status?: UserStatus,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({ role, status, search });
  }

  // ── GET /users/me  (any authenticated user) ───────────

  @Get('me')
  getMe(@CurrentUser() user: any) {
    return this.usersService.findOne(user.id);
  }

  // ── GET /users/:id  (admin only) ──────────────────────

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  // ── POST /users  (admin only) ─────────────────────────

  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  // ── PATCH /users/:id  (admin only) ───────────────────

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  // ── PATCH /users/me  (any authenticated user — update own profile) ─

  @Patch('me/profile')
  updateOwnProfile(@CurrentUser() user: any, @Body() dto: UpdateUserDto) {
    // Strip role/status — users can't promote themselves
    const { role, status, ...safeDto } = dto;
    return this.usersService.update(user.id, safeDto);
  }

  // ── PATCH /users/:id/password  (admin only) ──────────

  @Patch(':id/password')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(id, dto);
  }

  // ── PATCH /users/:id/toggle-status  (admin only) ─────

  @Patch(':id/toggle-status')
  @Roles(Role.ADMIN)
  toggleStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.toggleStatus(id);
  }

  // ── DELETE /users/:id  (admin only) ──────────────────

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
