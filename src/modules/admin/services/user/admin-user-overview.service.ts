import { Inject, Injectable } from '@nestjs/common';
import { AdminUserOverviewService } from '../../interfaces/services/user/admin-user-overview.service.interface';
import { ADMIN_TYPES } from '../../interfaces/types';
import { type AdminUserOverviewRepository } from '../../interfaces/repositories/user/admin-user-overview.repository.interface';
import { AdminUserOverviewResponseDto } from '../../dto/response/user/admin-user-overview.response.dto';

@Injectable()
export class AdminUserOverviewServiceImpl implements AdminUserOverviewService {
  constructor(
    @Inject(ADMIN_TYPES.repositories.AdminUserOverviewRepository)
    private readonly repository: AdminUserOverviewRepository,
  ) {}

  getOverview(): Promise<AdminUserOverviewResponseDto> {
    return this.repository.getOverview();
  }
}
