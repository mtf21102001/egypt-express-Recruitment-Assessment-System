import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'HR Manager', description: 'Name of the HR user' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'hr@company.com',
    description: 'Email address of the HR user',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'securePassword123',
    description: 'Password (min 6 characters)',
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({
    example: 'HR',
    description: 'Role of the user (ADMIN or HR)',
    required: false,
  })
  @IsString()
  @IsOptional()
  role?: string;
}
