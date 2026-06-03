import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, IsInt, Min } from 'class-validator';

export class StartAttemptDto {
  @ApiProperty({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'Assessment UUID to start',
  })
  @IsString()
  @IsNotEmpty()
  assessmentId: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the candidate',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    example: 'johndoe@example.com',
    description: 'Email address of the candidate',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+201234567890', description: 'Mobile phone number' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Cairo', description: 'Current residence city' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 2, description: 'Years of professional experience' })
  @IsInt()
  @Min(0)
  experienceYears: number;
}
