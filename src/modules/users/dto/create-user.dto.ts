import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsArray,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(150)
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;

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
