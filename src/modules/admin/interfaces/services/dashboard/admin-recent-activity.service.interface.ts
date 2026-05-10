import { RecentActivityResponseDto } from '../../../dto/response/dashboard/recent-activity.response.dto';

export interface AdminRecentActivityService {
  getRecentActivities(): Promise<RecentActivityResponseDto[]>;
}
