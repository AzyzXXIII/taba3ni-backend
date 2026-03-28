// src/modules/auth/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ 
    example: 'admin@taba3ni.tn', 
    description: 'User email address' 
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'Admin1234!', 
    description: 'User password' 
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
