import { Inject, Injectable } from '@nestjs/common';
import { RecentActivityResponseDto } from '../../dto/response/dashboard/recent-activity.response.dto';
import { type AdminRecentActivityApplication } from '../../interfaces/applications/dashboard/admin-recent-activity.application.interface';
import { type AdminRecentActivityService } from '../../interfaces/services/dashboard/admin-recent-activity.service.interface';
import { ADMIN_TYPES } from '../../interfaces/types';

@Injectable()
export class AdminRecentActivityApplicationImpl implements AdminRecentActivityApplication {
  constructor(
    @Inject(ADMIN_TYPES.services.AdminRecentActivityService)
    private readonly service: AdminRecentActivityService,
  ) {}

  getRecentActivities(): Promise<RecentActivityResponseDto[]> {
    return this.service.getRecentActivities();
  }
}
