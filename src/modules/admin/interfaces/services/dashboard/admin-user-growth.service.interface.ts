import { EntityManager } from 'typeorm';
import { UserGrowthQueryDto } from '../../../dto/query/dashboard/user-growth-query.dto';
import { UserGrowthResponseDto } from '../../../dto/response/dashboard/user-growth.response.dto';

export interface AdminUserGrowthService {
  getUserGrowth(
    query: UserGrowthQueryDto,
    manager?: EntityManager,
  ): Promise<UserGrowthResponseDto[]>;
}
