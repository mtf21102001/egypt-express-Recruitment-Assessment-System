import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { StartAttemptDto } from './dto/start-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import * as express from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Candidate Attempts')
@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post('start')
  @ApiOperation({
    summary:
      'Register candidate profile details and start assessment attempt (Public endpoint)',
  })
  @ApiResponse({
    status: 201,
    description:
      'Attempt successfully started; returns assessment questions without correct answer info',
  })
  @ApiResponse({
    status: 400,
    description: 'Attempt already completed or invalid request',
  })
  startAttempt(@Body() dto: StartAttemptDto) {
    return this.attemptsService.startAttempt(dto);
  }

  @Post(':id/submit')
  @ApiOperation({
    summary:
      'Submit exam answers and receive immediate graded result (Public endpoint)',
  })
  @ApiParam({ name: 'id', description: 'Attempt UUID' })
  @ApiResponse({
    status: 201,
    description: 'Answers graded successfully; returns attempt scorecard',
  })
  @ApiResponse({
    status: 400,
    description: 'Attempt already submitted or invalid request',
  })
  submitAttempt(@Param('id') id: string, @Body() dto: SubmitAttemptDto) {
    return this.attemptsService.submitAttempt(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('HR', 'ADMIN')
  @Get('export')
  @ApiOperation({
    summary: 'Export all completed attempts as a CSV spreadsheet (HR Only)',
  })
  @ApiResponse({ status: 200, description: 'CSV file download response' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async exportCsv(@Res() res: express.Response) {
    const csvContent = await this.attemptsService.exportAttemptsCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=attempts_export.csv',
    );
    return res.status(200).send(csvContent);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('HR', 'ADMIN')
  @Get()
  @ApiOperation({
    summary: 'Search and filter candidate assessment attempts (HR Only)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search query for candidate name or email',
  })
  @ApiQuery({
    name: 'jobId',
    required: false,
    description: 'Filter by job UUID',
  })
  @ApiQuery({
    name: 'assessmentId',
    required: false,
    description: 'Filter by assessment UUID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PASSED', 'FAILED'],
    description: 'Filter by passing status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of attempts matching criteria',
  })
  getAll(
    @Query('search') search?: string,
    @Query('jobId') jobId?: string,
    @Query('assessmentId') assessmentId?: string,
    @Query('status') status?: 'PASSED' | 'FAILED',
  ) {
    return this.attemptsService.getAllAttemptsForHR({
      search,
      jobId,
      assessmentId,
      status,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('HR', 'ADMIN')
  @Get(':id')
  @ApiOperation({
    summary:
      'Get candidate attempt details with correct vs incorrect answer breakdown (HR Only)',
  })
  @ApiParam({ name: 'id', description: 'Attempt UUID' })
  @ApiResponse({
    status: 200,
    description:
      'Attempt grading details with full questions and candidate answers',
  })
  @ApiResponse({ status: 404, description: 'Attempt not found' })
  getOne(@Param('id') id: string) {
    return this.attemptsService.getAttemptDetailsForHR(id);
  }
}
