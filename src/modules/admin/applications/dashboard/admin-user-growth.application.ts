import { Inject, Injectable } from '@nestjs/common';
import { UserGrowthQueryDto } from '../../dto/query/dashboard/user-growth-query.dto';
import { UserGrowthResponseDto } from '../../dto/response/dashboard/user-growth.response.dto';
import { AdminUserGrowthApplication } from '../../interfaces/applications/dashboard/admin-user-growth.application.interface';
import { type AdminUserGrowthService } from '../../interfaces/services/dashboard/admin-user-growth.service.interface';
import { ADMIN_TYPES } from '../../interfaces/types';

@Injectable()
export class AdminUserGrowthApplicationImpl implements AdminUserGrowthApplication {
  constructor(
    @Inject(ADMIN_TYPES.services.AdminUserGrowthService)
    private readonly service: AdminUserGrowthService,
  ) {}

  getUserGrowth(query: UserGrowthQueryDto): Promise<UserGrowthResponseDto[]> {
    return this.service.getUserGrowth(query);
  }
}
