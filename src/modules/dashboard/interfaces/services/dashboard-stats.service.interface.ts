import {
  DashboardDateRange,
  DashboardTaskStatsRow,
} from '../repositories/dashboard.repository.interface';

export interface DashboardStatsService {
  getStats(
    userId: string,
    range: DashboardDateRange,
  ): Promise<DashboardTaskStatsRow>;
}
