import { RecentActivityResponseDto } from '../../../dto/response/dashboard/recent-activity.response.dto';

export interface AdminRecentActivityApplication {
  getRecentActivities(): Promise<RecentActivityResponseDto[]>;
}
