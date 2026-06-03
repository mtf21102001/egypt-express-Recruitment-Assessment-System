import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsIn,
} from 'class-validator';

export class CreateAssessmentDto {
  @ApiProperty({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'Associated Job UUID',
  })
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @ApiProperty({
    example: 'Junior NestJS Exam',
    description: 'Title of the assessment',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'A test measuring NestJS, TypeScript, and database skills.',
    description: 'Detailed description of the exam',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 45,
    description: 'Duration of the assessment in minutes',
  })
  @IsInt()
  @Min(1)
  duration: number;

  @ApiProperty({
    example: 60,
    description: 'Passing score threshold percentage (0-100)',
  })
  @IsInt()
  @Min(0)
  passingScore: number;

  @ApiProperty({
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE'],
    description: 'Assessment active status',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;
}
