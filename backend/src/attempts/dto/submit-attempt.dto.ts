import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CandidateAnswerDto {
  @ApiProperty({
    example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    description: 'Question UUID',
  })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({
    example: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    description: 'Selected Option UUID (for SINGLE_CHOICE or TRUE_FALSE)',
    required: false,
  })
  @IsString()
  @IsOptional()
  selectedOptionId?: string;

  @ApiProperty({
    example: ['c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'],
    type: [String],
    description: 'List of selected option UUIDs (for MULTIPLE_CORRECT)',
    required: false,
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  selectedOptionIds?: string[];

  @ApiProperty({
    example: 'This is a text answer.',
    description: 'Text or code response (for TEXT questions)',
    required: false,
  })
  @IsString()
  @IsOptional()
  textAnswer?: string;
}

export class SubmitAttemptDto {
  @ApiProperty({
    type: [CandidateAnswerDto],
    description: 'List of submitted answers for grading',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CandidateAnswerDto)
  answers: CandidateAnswerDto[];
}
