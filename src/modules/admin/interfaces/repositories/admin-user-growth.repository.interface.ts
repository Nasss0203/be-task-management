import { EntityManager } from 'typeorm';
import { UserGrowthQueryDto } from '../../dto/query/user-growth-query.dto';
import { UserGrowthResponseDto } from '../../dto/response/user-growth.response.dto';

export interface AdminUserGrowthRepository {
  getUserGrowth(
    query: UserGrowthQueryDto,
    manager?: EntityManager,
  ): Promise<UserGrowthResponseDto[]>;
}
