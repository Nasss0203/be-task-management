import { UserGrowthQueryDto } from '../../../dto/query/dashboard/user-growth-query.dto';
import { UserGrowthResponseDto } from '../../../dto/response/dashboard/user-growth.response.dto';

export interface AdminUserGrowthApplication {
  getUserGrowth(query: UserGrowthQueryDto): Promise<UserGrowthResponseDto[]>;
}
