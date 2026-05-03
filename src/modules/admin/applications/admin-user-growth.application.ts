import { Inject, Injectable } from '@nestjs/common';
import { UserGrowthQueryDto } from '../dto/query/user-growth-query.dto';
import { UserGrowthResponseDto } from '../dto/response/user-growth.response.dto';
import { AdminUserGrowthApplication } from '../interfaces/applications/admin-user-growth.application.interface';
import { type AdminUserGrowthService } from '../interfaces/services/admin-user-growth.service.interface';
import { ADMIN_TYPES } from '../interfaces/types';

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
