import { Inject, Injectable } from '@nestjs/common';
import { UserGrowthQueryDto } from '../../dto/query/dashboard/user-growth-query.dto';
import { UserGrowthResponseDto } from '../../dto/response/dashboard/user-growth.response.dto';
import { type AdminUserGrowthRepository } from '../../interfaces/repositories/dashboard/admin-user-growth.repository.interface';
import { AdminUserGrowthService } from '../../interfaces/services/dashboard/admin-user-growth.service.interface';
import { ADMIN_TYPES } from '../../interfaces/types';

@Injectable()
export class AdminUserGrowthServiceImpl implements AdminUserGrowthService {
  constructor(
    @Inject(ADMIN_TYPES.repositories.AdminUserGrowthRepository)
    private readonly repository: AdminUserGrowthRepository,
  ) {}

  async getUserGrowth(
    query: UserGrowthQueryDto,
  ): Promise<UserGrowthResponseDto[]> {
    try {
      console.log('User growth query:', query);

      return await this.repository.getUserGrowth(query);
    } catch (error) {
      console.error('Admin user growth error:', error);
      throw error;
    }
  }
}
