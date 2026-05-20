import { AdminUserOverviewResponseDto } from "src/modules/admin/dto/response/user/admin-user-overview.response.dto";


export interface AdminUserOverviewService {
  getOverview(): Promise<AdminUserOverviewResponseDto>;
}
