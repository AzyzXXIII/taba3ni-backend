import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../../../common/enums/role.enum';
import { UserStatus } from '../../../common/enums/user-status.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column()
  password: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.CLIENT,
  })
  role: Role;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // ── Distributor-specific fields ───────────────────────

  @Column({ length: 150, nullable: true })
  vehicle: string;

  @Column({ type: 'simple-array', nullable: true })
  zones: string[];

  // ── Client-specific fields ────────────────────────────

  @Column({ length: 150, nullable: true })
  storeName: string;

  @Column({ length: 50, nullable: true })
  taxId: string;

  // ── Timestamps ────────────────────────────────────────

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ── Hooks ─────────────────────────────────────────────

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // Only re-hash if password was actually changed (not already a bcrypt hash)
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  // ── Helper ────────────────────────────────────────────

  async validatePassword(plainText: string): Promise<boolean> {
    return bcrypt.compare(plainText, this.password);
  }
}