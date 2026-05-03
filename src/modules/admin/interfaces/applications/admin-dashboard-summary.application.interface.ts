import { DashboardSummaryResponseDto } from '../../dto/response/dashboard-summary.response.dto';

export interface AdminDashboardSummaryApplication {
  getSummary(): Promise<DashboardSummaryResponseDto>;
}
