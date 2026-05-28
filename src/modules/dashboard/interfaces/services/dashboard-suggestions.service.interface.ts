import { DashboardSuggestionResponseDto } from '../../dto/response/my-dashboard.response.dto';
import {
  DashboardDateRange,
  DashboardTaskStatsRow,
} from '../repositories/dashboard.repository.interface';

export interface DashboardSuggestionsService {
  getSuggestions(
    userId: string,
    range: DashboardDateRange,
    stats: DashboardTaskStatsRow,
  ): Promise<DashboardSuggestionResponseDto[]>;
}
