import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';

export class UpdateAssessmentDto {
  @ApiProperty({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'Associated Job UUID',
    required: false,
  })
  @IsString()
  @IsOptional()
  jobId?: string;

  @ApiProperty({
    example: 'Senior NestJS Exam',
    description: 'Title of the assessment',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    example: 'Advanced assessment.',
    description: 'Detailed description of the exam',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 60,
    description: 'Duration of the assessment in minutes',
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  duration?: number;

  @ApiProperty({
    example: 70,
    description: 'Passing score threshold percentage (0-100)',
    required: false,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  passingScore?: number;

  @ApiProperty({
    example: 'INACTIVE',
    enum: ['ACTIVE', 'INACTIVE'],
    description: 'Assessment active status',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;
}
