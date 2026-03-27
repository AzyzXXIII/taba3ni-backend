import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum';
import { UserStatus } from '../../../common/enums/user-status.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  // ── Distributor fields ──────────────────────────────

  @IsOptional()
  @IsString()
  @MaxLength(150)
  vehicle?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  zones?: string[];

  // ── Client fields ───────────────────────────────────

  @IsOptional()
  @IsString()
  @MaxLength(150)
  storeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;
}
