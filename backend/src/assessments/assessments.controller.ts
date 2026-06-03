import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Assessments')
@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Get(':id/public')
  @ApiOperation({
    summary:
      'Get public assessment metadata details (Public endpoint for candidates)',
  })
  @ApiParam({ name: 'id', description: 'Assessment UUID' })
  @ApiResponse({
    status: 200,
    description: 'Public assessment details returned successfully',
  })
  @ApiResponse({ status: 404, description: 'Assessment not found or inactive' })
  getPublicDetails(@Param('id') id: string) {
    return this.assessmentsService.getPublicDetails(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('HR', 'ADMIN')
  @Post()
  @ApiOperation({ summary: 'Create a new assessment' })
  @ApiResponse({ status: 201, description: 'Assessment created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createAssessmentDto: CreateAssessmentDto) {
    return this.assessmentsService.create(createAssessmentDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('HR', 'ADMIN')
  @Get()
  @ApiOperation({ summary: 'Get all assessments' })
  @ApiResponse({ status: 200, description: 'List of assessments' })
  findAll() {
    return this.assessmentsService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('HR', 'ADMIN')
  @Get(':id')
  @ApiOperation({
    summary: 'Get assessment by ID (includes all questions and options)',
  })
  @ApiParam({ name: 'id', description: 'Assessment UUID' })
  @ApiResponse({
    status: 200,
    description: 'Assessment details with questions',
  })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  findOne(@Param('id') id: string) {
    return this.assessmentsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('HR', 'ADMIN')
  @Put(':id')
  @ApiOperation({ summary: 'Update an assessment' })
  @ApiParam({ name: 'id', description: 'Assessment UUID' })
  @ApiResponse({ status: 200, description: 'Assessment updated successfully' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  update(
    @Param('id') id: string,
    @Body() updateAssessmentDto: UpdateAssessmentDto,
  ) {
    return this.assessmentsService.update(id, updateAssessmentDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('HR', 'ADMIN')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an assessment' })
  @ApiParam({ name: 'id', description: 'Assessment UUID' })
  @ApiResponse({ status: 200, description: 'Assessment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  remove(@Param('id') id: string) {
    return this.assessmentsService.remove(id);
  }
}
