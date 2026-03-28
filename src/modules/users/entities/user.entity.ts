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
import * as bcrypt from 'bcryptjs';
import { Role } from '../../../common/enums/role.enum';
import { UserStatus } from '../../../common/enums/user-status.enum';

@Entity('users')
@Index(['role'])
@Index(['status'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 150 })
  email: string;

  // ✅ No select:false — password exposure is handled by sanitizeUser() in the service.
  // TypeORM's select:false breaks explicit select:['password'] queries too — a known gotcha.
  @Column()
  password: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ type: 'enum', enum: Role, default: Role.CLIENT })
  role: Role;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ length: 150, nullable: true })
  vehicle: string;

  @Column({ type: 'simple-array', nullable: true })
  zones: string[];

  @Column({ length: 150, nullable: true })
  storeName: string;

  @Column({ length: 50, nullable: true })
  taxId: string;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ── Hooks ────────────────────────────────────────────────────

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  // ✅ Fix #6: toJSON() removed — sanitizeUser() in UsersService is the single
  // source of truth for stripping sensitive fields. Two competing mechanisms
  // cause subtle bugs when one gets updated but the other doesn't.
  async validatePassword(plainText: string): Promise<boolean> {
    return bcrypt.compare(plainText, this.password);
  }
}
