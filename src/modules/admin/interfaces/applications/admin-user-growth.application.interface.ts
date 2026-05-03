import { UserGrowthQueryDto } from '../../dto/query/user-growth-query.dto';
import { UserGrowthResponseDto } from '../../dto/response/user-growth.response.dto';

export interface AdminUserGrowthApplication {
  getUserGrowth(query: UserGrowthQueryDto): Promise<UserGrowthResponseDto[]>;
}
