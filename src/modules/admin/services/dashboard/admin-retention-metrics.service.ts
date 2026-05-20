import { Inject, Injectable } from '@nestjs/common';
import { RetentionMetricResponseDto } from '../../dto/response/dashboard/retention-metrics.response.dto';
import { type AdminRetentionMetricsRepository } from '../../interfaces/repositories/dashboard/admin-retention-metrics.repository.interface';
import { type AdminRetentionMetricsService } from '../../interfaces/services/dashboard/admin-retention-metrics.service.interface';
import { ADMIN_TYPES } from '../../interfaces/types';

@Injectable()
export class AdminRetentionMetricsServiceImpl implements AdminRetentionMetricsService {
  constructor(
    @Inject(ADMIN_TYPES.repositories.AdminRetentionMetricsRepository)
    private readonly repository: AdminRetentionMetricsRepository,
  ) {}

  getRetentionMetrics(): Promise<RetentionMetricResponseDto[]> {
    return this.repository.getRetentionMetrics();
  }
}
