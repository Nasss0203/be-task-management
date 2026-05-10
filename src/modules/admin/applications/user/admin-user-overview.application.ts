import { Inject, Injectable } from '@nestjs/common';
import { AdminUserOverviewResponseDto } from '../../dto/response/user/admin-user-overview.response.dto';
import { AdminUserOverviewApplication } from '../../interfaces/applications/user/admin-user-overview.application.interface';
import { type AdminUserOverviewService } from '../../interfaces/services/user/admin-user-overview.service.interface';
import { ADMIN_TYPES } from '../../interfaces/types';

@Injectable()
export class AdminUserOverviewApplicationImpl implements AdminUserOverviewApplication {
  constructor(
    @Inject(ADMIN_TYPES.services.AdminUserOverviewService)
    private readonly service: AdminUserOverviewService,
  ) {}

  getOverview(): Promise<AdminUserOverviewResponseDto> {
    return this.service.getOverview();
  }
}
