import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsIn,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOptionDto } from './create-question.dto';

export class UpdateQuestionDto {
  @ApiProperty({
    example: 'What is the default HTTP status code?',
    description: 'The question content text',
    required: false,
  })
  @IsString()
  @IsOptional()
  questionText?: string;

  @ApiProperty({
    example: 'MULTIPLE_CHOICE',
    enum: ['MULTIPLE_CHOICE', 'MULTIPLE_CORRECT', 'TRUE_FALSE', 'TEXT'],
    description: 'The question format type',
    required: false,
  })
  @IsString()
  @IsIn(['MULTIPLE_CHOICE', 'MULTIPLE_CORRECT', 'TRUE_FALSE', 'TEXT'])
  @IsOptional()
  questionType?: string;

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
