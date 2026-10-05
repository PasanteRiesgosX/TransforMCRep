import { Controller, Get, UseGuards } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';

@Controller('admin/metrics')
@UseGuards(JwtAuthGuard, AdminGuard)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  getMetrics() {
    return this.metricsService.getMetrics();
  }
}
