import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

// ✅ Fix #5: Role is intentionally removed from this DTO.
// Public registration always creates a CLIENT — admins create other roles
// via POST /users (admin-only endpoint).
// This prevents anyone from self-registering as admin or distributor.
export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: '+216 98 123 456' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Tunis' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'My Store Name' })
  @IsOptional()
  @IsString()
  storeName?: string;
}
