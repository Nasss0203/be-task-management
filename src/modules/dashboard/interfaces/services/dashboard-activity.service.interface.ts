import { DashboardActivityResponseDto } from '../../dto/response/my-dashboard.response.dto';

export interface DashboardActivityService {
  getRecentActivities(
    userId: string,
    limit: number,
  ): Promise<DashboardActivityResponseDto[]>;
}
