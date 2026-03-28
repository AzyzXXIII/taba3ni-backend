// src/modules/auth/dto/register.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Password (min 6 characters)' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: '+216 98 123 456', description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Tunis', description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ enum: Role, default: Role.CLIENT, description: 'User role' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
