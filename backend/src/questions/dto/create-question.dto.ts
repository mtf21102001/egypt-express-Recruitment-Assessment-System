import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsIn,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOptionDto {
  @ApiProperty({
    example: '201 Created',
    description: 'Option text description',
  })
  @IsString()
  @IsNotEmpty()
  optionText: string;

  @ApiProperty({
    example: true,
    description: 'True if this is a correct option',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isCorrect?: boolean;
}

export class CreateQuestionDto {
  @ApiProperty({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'Associated Assessment UUID',
  })
  @IsString()
  @IsNotEmpty()
  assessmentId: string;

  @ApiProperty({
    example:
      'What is the default HTTP status code for successful POST in NestJS?',
    description: 'The question content text',
  })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiProperty({
    example: 'MULTIPLE_CHOICE',
    enum: ['MULTIPLE_CHOICE', 'MULTIPLE_CORRECT', 'TRUE_FALSE', 'TEXT'],
    description: 'The question format type',
  })
  @IsString()
  @IsIn(['MULTIPLE_CHOICE', 'MULTIPLE_CORRECT', 'TRUE_FALSE', 'TEXT'])
  questionType: string;

  @ApiProperty({
    type: [CreateOptionDto],
    description: 'List of answer choices (options) for selection questions',
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options?: CreateOptionDto[];
}
