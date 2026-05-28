import { Inject, Injectable } from '@nestjs/common';
import {
  DashboardDateRange,
  DashboardTaskStatsRow,
  type DashboardRepository,
} from '../interfaces/repositories/dashboard.repository.interface';
import { DashboardStatsService } from '../interfaces/services/dashboard-stats.service.interface';
import { DASHBOARD_TYPES } from '../interfaces/types';

@Injectable()
export class DashboardStatsServiceImpl implements DashboardStatsService {
  constructor(
    @Inject(DASHBOARD_TYPES.repositories.DashboardRepository)
    private readonly dashboardRepository: DashboardRepository,
  ) {}

  async getStats(
    userId: string,
    range: DashboardDateRange,
  ): Promise<DashboardTaskStatsRow> {
    return this.dashboardRepository.getTaskStats(userId, range);
  }
}
