import { RecentActivityResponseDto } from '../../../dto/response/dashboard/recent-activity.response.dto';

export interface AdminRecentActivityRepository {
  getRecentActivities(): Promise<RecentActivityResponseDto[]>;
}
