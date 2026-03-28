// src/modules/users/dto/update-user.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';
import { UserStatus } from '../../../common/enums/user-status.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe', description: 'Full name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'john@example.com', description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+216 98 123 456', description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Tunis', description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ enum: Role, description: 'User role' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ enum: UserStatus, description: 'User status' })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ example: 'Carrefour Lac 2', description: 'Store name (for clients)' })
  @IsOptional()
  @IsString()
  storeName?: string;

  @ApiPropertyOptional({ example: 'TN-123456789', description: 'Tax ID (for clients)' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ example: 'Refrigerated Truck', description: 'Vehicle (for distributors)' })
  @IsOptional()
  @IsString()
  vehicle?: string;

  @ApiPropertyOptional({ example: ['Tunis', 'Ariana'], description: 'Delivery zones (for distributors)' })
  @IsOptional()
  zones?: string[];
}
