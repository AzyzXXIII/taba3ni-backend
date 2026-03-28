// src/modules/users/dto/change-password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldPassword123', description: 'Current password' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'newPassword123', description: 'New password (min 6 characters)', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
