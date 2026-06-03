import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateJobDto {
  @ApiProperty({
    example: 'Node.js Backend Developer',
    description: 'Title of the job position',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    example: 'Must have 3+ years of experience.',
    description: 'Job description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'INACTIVE',
    enum: ['ACTIVE', 'INACTIVE'],
    description: 'Job availability status',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;
}
