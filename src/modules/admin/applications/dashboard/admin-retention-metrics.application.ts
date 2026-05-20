import { Inject, Injectable } from '@nestjs/common';
import { RetentionMetricResponseDto } from '../../dto/response/dashboard/retention-metrics.response.dto';
import { type AdminRetentionMetricsApplication } from '../../interfaces/applications/dashboard/admin-retention-metrics.application.interface';
import { type AdminRetentionMetricsService } from '../../interfaces/services/dashboard/admin-retention-metrics.service.interface';
import { ADMIN_TYPES } from '../../interfaces/types';

@Injectable()
export class AdminRetentionMetricsApplicationImpl implements AdminRetentionMetricsApplication {
  constructor(
    @Inject(ADMIN_TYPES.services.AdminRetentionMetricsService)
    private readonly service: AdminRetentionMetricsService,
  ) {}

  getRetentionMetrics(): Promise<RetentionMetricResponseDto[]> {
    return this.service.getRetentionMetrics();
  }
}
