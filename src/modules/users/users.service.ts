import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Brackets } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Role } from '../../common/enums/role.enum';
import { UserStatus } from '../../common/enums/user-status.enum';
import * as bcrypt from 'bcryptjs';

// ✅ Plain object type — no class methods, safe to return from API
export type SafeUser = Omit<User, 'password' | 'hashPassword' | 'validatePassword'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async findAll(filters?: {
    role?: Role;
    status?: UserStatus;
    search?: string;
  }): Promise<SafeUser[]> {
    const queryBuilder = this.usersRepo.createQueryBuilder('user');

    if (filters?.role) {
      queryBuilder.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters?.status) {
      queryBuilder.andWhere('user.status = :status', { status: filters.status });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        new Brackets(qb => {
          qb.where('LOWER(user.name) LIKE :search', { search: `%${filters.search!.toLowerCase()}%` })
            .orWhere('LOWER(user.email) LIKE :search', { search: `%${filters.search!.toLowerCase()}%` })
            .orWhere('user.phone LIKE :search', { search: `%${filters.search}%` })
            .orWhere('LOWER(user.city) LIKE :search', { search: `%${filters.search!.toLowerCase()}%` });
        }),
      );
    }

    queryBuilder.orderBy('user.createdAt', 'DESC').addOrderBy('user.name', 'ASC');

    const users = await queryBuilder.getMany();
    return users.map(user => this.sanitizeUser(user));
  }

  async findOne(id: string): Promise<SafeUser> {
    const user = await this.findUserById(id);
    return this.sanitizeUser(user);
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { email } as FindOptionsWhere<User>,
      select: ['id', 'email', 'password', 'role', 'status', 'name',
               'city', 'phone', 'storeName', 'vehicle', 'zones'],
    });
  }

  async create(dto: CreateUserDto): Promise<SafeUser> {
    await this.ensureEmailUnique(dto.email);

    const hashedPassword = await this.hashPassword(dto.password);

    const user = this.usersRepo.create({
      ...dto,
      password: hashedPassword,
      status: UserStatus.ACTIVE,
      role: dto.role ?? Role.CLIENT,
    });

    const savedUser = await this.usersRepo.save(user);
    return this.sanitizeUser(savedUser);
  }

  async update(id: string, dto: UpdateUserDto): Promise<SafeUser> {
    await this.findUserById(id);

    if (dto.email) {
      await this.ensureEmailUnique(dto.email, id);
    }

    // ✅ No dto.password here — password changes go through changePassword()
    const userToUpdate = await this.usersRepo.preload({ id, ...dto });

    if (!userToUpdate) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updatedUser = await this.usersRepo.save(userToUpdate);
    return this.sanitizeUser(updatedUser);
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.usersRepo.findOne({
      where: { id } as FindOptionsWhere<User>,
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.password = await this.hashPassword(dto.newPassword);
    await this.usersRepo.save(user);
  }

  async toggleStatus(id: string): Promise<SafeUser> {
    const user = await this.findUserById(id);

    if (user.role === Role.ADMIN) {
      throw new ForbiddenException('Admin accounts cannot be deactivated.');
    }

    user.status = user.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;

    const updatedUser = await this.usersRepo.save(user);
    return this.sanitizeUser(updatedUser);
  }

  async hardDelete(id: string): Promise<void> {
    const user = await this.findUserById(id);

    if (user.role === Role.ADMIN) {
      throw new ForbiddenException('Admin accounts cannot be deleted');
    }

    await this.usersRepo.remove(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepo.update(id, { lastLoginAt: new Date() });
  }

  async getStatistics() {
    const totalUsers = await this.usersRepo.count();
    const activeUsers = await this.usersRepo.count({
      where: { status: UserStatus.ACTIVE } as FindOptionsWhere<User>,
    });
    const adminCount = await this.usersRepo.count({
      where: { role: Role.ADMIN } as FindOptionsWhere<User>,
    });
    const distributorCount = await this.usersRepo.count({
      where: { role: Role.DISTRIBUTOR } as FindOptionsWhere<User>,
    });

    return {
      total: totalUsers,
      active: activeUsers,
      admins: adminCount,
      distributors: distributorCount,
      clients: totalUsers - (adminCount + distributorCount),
      activationRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
    };
  }

  // ── Private helpers ──────────────────────────────────────────

  private async findUserById(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { id } as FindOptionsWhere<User>,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  private async ensureEmailUnique(email: string, excludeUserId?: string): Promise<void> {
    const qb = this.usersRepo.createQueryBuilder('user').where('user.email = :email', { email });

    if (excludeUserId) {
      qb.andWhere('user.id != :excludeUserId', { excludeUserId });
    }

    const existing = await qb.getOne();
    if (existing) {
      throw new ConflictException(`Email ${email} is already in use`);
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // ✅ FIXED: Only remove password, not non-existent methods
  private sanitizeUser(user: User): SafeUser {
    // Create a plain object without the password
    const { password, ...safeUser } = user;
    return safeUser as SafeUser;
  }
}
