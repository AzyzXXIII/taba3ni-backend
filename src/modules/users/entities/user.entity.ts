// src/modules/users/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; // ← Add this
import * as bcrypt from 'bcryptjs';
import { Role } from '../../../common/enums/role.enum';
import { UserStatus } from '../../../common/enums/user-status.enum';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['role'])
@Index(['status'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'User unique identifier', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @Column({ length: 100 })
  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  name: string;

  @Column({ unique: true, length: 150 })
  @ApiProperty({ description: 'User email address', example: 'john@example.com' })
  email: string;

  @Column({ select: false })
  @ApiProperty({ description: 'User password (hashed)', writeOnly: true, example: 'password123' })
  password: string;

  @Column({ length: 20, nullable: true })
  @ApiPropertyOptional({ description: 'User phone number', example: '+216 98 123 456' })
  phone: string;

  @Column({ length: 100, nullable: true })
  @ApiPropertyOptional({ description: 'User city', example: 'Tunis' })
  city: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.CLIENT,
  })
  @ApiProperty({ enum: Role, description: 'User role', example: Role.CLIENT })
  role: Role;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  @ApiProperty({ enum: UserStatus, description: 'User account status', example: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({ description: 'Admin notes about user' })
  notes: string;

  // ── Distributor-specific fields ───────────────────────
  @Column({ length: 150, nullable: true })
  @ApiPropertyOptional({ description: 'Vehicle (for distributors)', example: 'Refrigerated Truck' })
  vehicle: string;

  @Column({ type: 'simple-array', nullable: true })
  @ApiPropertyOptional({ description: 'Delivery zones (for distributors)', example: ['Tunis', 'Ariana'] })
  zones: string[];

  // ── Client-specific fields ────────────────────────────
  @Column({ length: 150, nullable: true })
  @ApiPropertyOptional({ description: 'Store name (for clients)', example: 'Carrefour Lac 2' })
  storeName: string;

  @Column({ length: 50, nullable: true })
  @ApiPropertyOptional({ description: 'Tax ID (for clients)', example: 'TN-123456789' })
  taxId: string;

  // ── Timestamps ────────────────────────────────────────
  @Column({ type: 'timestamp', nullable: true })
  @ApiPropertyOptional({ description: 'Last login timestamp' })
  lastLoginAt: Date;

  @CreateDateColumn()
  @ApiProperty({ description: 'User creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'User last update timestamp' })
  updatedAt: Date;

  // ── Hooks ─────────────────────────────────────────────
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  // ── Helper Methods ────────────────────────────────────
  async validatePassword(plainText: string): Promise<boolean> {
    return bcrypt.compare(plainText, this.password);
  }

  // Remove sensitive data when converting to JSON
  toJSON(): Partial<User> {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}
