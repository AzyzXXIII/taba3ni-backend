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
import { UsersService } from './users.service';
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

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── GET /users  (admin only) ──────────────────────────
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
  getMe(@CurrentUser() user: JwtUser) {
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

  // ── PATCH /users/me/profile  (any authenticated user) ─
  @Patch('me/profile')
  updateOwnProfile(@CurrentUser() user: JwtUser, @Body() dto: UpdateUserDto) {
    // Strip role/status — users can't promote themselves
    const { role: _role, status: _status, ...safeDto } = dto;
    return this.usersService.update(user.id, safeDto);
  }

  // ── PATCH /users/:id/password  (admin only) ──────────
  @Patch(':id/password')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangePasswordDto,
  ) {
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
    return this.usersService.hardDelete(id);
  }
}
