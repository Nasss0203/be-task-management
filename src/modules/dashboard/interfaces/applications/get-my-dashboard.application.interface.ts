import { MyDashboardResponseDto } from '../../dto/response/my-dashboard.response.dto';

export interface GetMyDashboardInput {
  userId: string;
  username: string;
  date?: string;
  timezone?: string;
  limit?: number;
}

export interface GetMyDashboardApplication {
  getMyDashboard(input: GetMyDashboardInput): Promise<MyDashboardResponseDto>;
}
