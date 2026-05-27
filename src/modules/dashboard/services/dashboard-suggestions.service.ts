import { Inject, Injectable } from '@nestjs/common';
import { DashboardSuggestionResponseDto } from '../dto/response/my-dashboard.response.dto';
import {
  DashboardDateRange,
  DashboardTaskStatsRow,
  type DashboardRepository,
} from '../interfaces/repositories/dashboard.repository.interface';
import { DashboardSuggestionsService } from '../interfaces/services/dashboard-suggestions.service.interface';
import { DASHBOARD_TYPES } from '../interfaces/types';

@Injectable()
export class DashboardSuggestionsServiceImpl implements DashboardSuggestionsService {
  constructor(
    @Inject(DASHBOARD_TYPES.repositories.DashboardRepository)
    private readonly dashboardRepository: DashboardRepository,
  ) {}

  async getSuggestions(
    userId: string,
    _range: DashboardDateRange,
    stats: DashboardTaskStatsRow,
  ): Promise<DashboardSuggestionResponseDto[]> {
    const unassignedTaskCount =
      await this.dashboardRepository.countUnassignedTasks(userId);

    const suggestions: DashboardSuggestionResponseDto[] = [];

    if (unassignedTaskCount > 0) {
      suggestions.push({
        type: 'assign_owner',
        message: `Chốt owner cho ${unassignedTaskCount} task chưa assign.`,
      });
    }

    if (stats.overdue > 0) {
      suggestions.push({
        type: 'handle_overdue',
        message: `Xử lý hoặc dời deadline cho ${stats.overdue} task quá hạn.`,
      });
    }

    if (stats.reviewTaskCount > 0) {
      suggestions.push({
        type: 'review_tasks',
        message: `Review ${stats.reviewTaskCount} task đang chờ kiểm tra.`,
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        type: 'plan_today',
        message: 'Chọn 2 task quan trọng nhất để ưu tiên trong hôm nay.',
      });
    }

    return suggestions.slice(0, 3);
  }
}
