import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('HR Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HR', 'ADMIN')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Get overview KPI metrics for the recruitment dashboard (HR Only)',
  })
  @ApiResponse({
    status: 200,
    description: 'KPI metrics, passed/failed ratios, and latest attempts list',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getStats() {
    return this.dashboardService.getStats();
  }
}
