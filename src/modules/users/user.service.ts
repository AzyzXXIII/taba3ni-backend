import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, Brackets } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Role } from '../../common/enums/role.enum';
import { UserStatus } from '../../common/enums/user-status.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  /**
   * Find all users with optional filters
   * ✅ Best Practice: Use QueryBuilder for complex queries with proper typing
   */
  async findAll(filters?: {
    role?: Role;
    status?: UserStatus;
    search?: string;
  }): Promise<Omit<User, 'password'>[]> {
    const queryBuilder = this.usersRepo.createQueryBuilder('user');

    if (filters?.role) {
      queryBuilder.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters?.status) {
      queryBuilder.andWhere('user.status = :status', { status: filters.status });
    }

    if (filters?.search) {
      // ✅ Best Practice: Use Brackets for complex OR conditions
      queryBuilder.andWhere(
        new Brackets(qb => {
          qb.where('LOWER(user.name) LIKE :search', { search: `%${filters.search!.toLowerCase()}%` })
            .orWhere('LOWER(user.email) LIKE :search', { search: `%${filters.search!.toLowerCase()}%` })
            .orWhere('user.phone LIKE :search', { search: `%${filters.search}%` })
            .orWhere('LOWER(user.city) LIKE :search', { search: `%${filters.search!.toLowerCase()}%` });
        })
      );
    }

    queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .addOrderBy('user.name', 'ASC');

    const users = await queryBuilder.getMany();
    return users.map(user => this.sanitizeUser(user));
  }

  /**
   * Find user by ID
   * ✅ Best Practice: Always handle not found cases with proper exception
   */
  async findOne(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.findUserById(id);
    return this.sanitizeUser(user);
  }

  /**
   * Find user by email with password (for auth)
   * ✅ Best Practice: Separate method for auth that includes password
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return await this.usersRepo.findOne({
      where: { email } as FindOptionsWhere<User>,
      select: ['id', 'email', 'password', 'role', 'status', 'name'], // Explicitly select password
    });
  }

  /**
   * Create new user
   * ✅ Best Practice: Validate, hash password, handle duplicates
   */
  async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    // Check for existing user
    await this.ensureEmailUnique(dto.email);

    // Hash password
    const hashedPassword = await this.hashPassword(dto.password);

    // Create user with default values
    const user = this.usersRepo.create({
      ...dto,
      password: hashedPassword,
      status: UserStatus.ACTIVE,
      role: dto.role || Role.CLIENT,
    });

    const savedUser = await this.usersRepo.save(user);
    return this.sanitizeUser(savedUser);
  }

  /**
   * Update user
   * ✅ Best Practice: Use preload for safe updates, validate email uniqueness
   */
  async update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    // Check if user exists
    await this.findUserById(id);

    // Check email uniqueness if changing
    if (dto.email) {
      await this.ensureEmailUnique(dto.email, id);
    }

    // Hash password if updating
    if (dto.password) {
      dto.password = await this.hashPassword(dto.password);
    }

    // Use preload for safe partial update
    const userToUpdate = await this.usersRepo.preload({
      id,
      ...dto,
    });

    if (!userToUpdate) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updatedUser = await this.usersRepo.save(userToUpdate);
    return this.sanitizeUser(updatedUser);
  }

  /**
   * Change user password
   * ✅ Best Practice: Verify current password before changing
   */
  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.usersRepo.findOne({
      where: { id } as FindOptionsWhere<User>,
      select: ['id', 'password'], // Only select what we need
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Verify current password
    try {
      const isPasswordValid = await bcrypt.compare(
        dto.currentPassword,
        user.password,
      );

      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Password verification failed');
    }

    // Hash and update new password
    user.password = await this.hashPassword(dto.newPassword);
    await this.usersRepo.save(user);
  }

  /**
   * Toggle user active status
   * ✅ Best Practice: Prevent deactivating admin accounts
   */
  async toggleStatus(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.findUserById(id);

    // ✅ Best Practice: Business rule validation
    if (user.role === Role.ADMIN) {
      throw new ForbiddenException(
        'Admin accounts cannot be deactivated. Please contact support.',
      );
    }

    user.status =
      user.status === UserStatus.ACTIVE
        ? UserStatus.INACTIVE
        : UserStatus.ACTIVE;

    const updatedUser = await this.usersRepo.save(user);
    return this.sanitizeUser(updatedUser);
  }

  /**
   * Soft delete user
   * ✅ Best Practice: Use soft delete instead of hard delete for audit trail
   */
  async softDelete(id: string): Promise<void> {
    const user = await this.findUserById(id);

    if (user.role === Role.ADMIN) {
      throw new ForbiddenException('Admin accounts cannot be deleted');
    }

    // ✅ Best Practice: Use soft delete if you have @DeleteDateColumn
    await this.usersRepo.softDelete(id);
    // Or use remove if you don't have soft delete
    // await this.usersRepo.remove(user);
  }

  /**
   * Hard delete user (use with caution)
   * ✅ Best Practice: Only admins should be able to hard delete
   */
  async hardDelete(id: string): Promise<void> {
    const user = await this.findUserById(id);

    if (user.role === Role.ADMIN) {
      throw new ForbiddenException('Admin accounts cannot be deleted');
    }

    await this.usersRepo.remove(user);
  }

  /**
   * Update last login timestamp
   * ✅ Best Practice: Use update for simple field updates
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepo.update(id, { lastLoginAt: new Date() });
  }

  /**
   * Get user statistics
   * ✅ Best Practice: Use raw queries for aggregated data
   */
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
      activationRate: (activeUsers / totalUsers) * 100,
    };
  }

  // ────────────────── Private Helper Methods ──────────────────

  /**
   * Find user by ID (internal use)
   * ✅ Best Practice: Reusable method with consistent error handling
   */
  private async findUserById(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { id } as FindOptionsWhere<User>,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Ensure email is unique
   * ✅ Best Practice: Centralized email uniqueness check
   */
  private async ensureEmailUnique(email: string, excludeUserId?: string): Promise<void> {
    const queryBuilder = this.usersRepo
      .createQueryBuilder('user')
      .where('user.email = :email', { email });

    if (excludeUserId) {
      queryBuilder.andWhere('user.id != :excludeUserId', { excludeUserId });
    }

    const existingUser = await queryBuilder.getOne();

    if (existingUser) {
      throw new ConflictException(
        `Email ${email} is already in use by another account`,
      );
    }
  }

  /**
   * Hash password
   * ✅ Best Practice: Centralized password hashing with appropriate salt rounds
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10; // ✅ Best Practice: 10-12 rounds is standard
    try {
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      throw new BadRequestException('Failed to hash password');
    }
  }

  /**
   * Sanitize user by removing sensitive data
   * ✅ Best Practice: Type-safe sanitization with explicit return type
   */
  private sanitizeUser(user: User): Omit<User, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;
    return safeUser;
  }
}
