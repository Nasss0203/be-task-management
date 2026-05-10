import { Inject, Injectable } from '@nestjs/common';
import { RecentActivityResponseDto } from '../../dto/response/dashboard/recent-activity.response.dto';
import { type AdminRecentActivityRepository } from '../../interfaces/repositories/dashboard/admin-recent-activity.repository.interface';
import { type AdminRecentActivityService } from '../../interfaces/services/dashboard/admin-recent-activity.service.interface';
import { ADMIN_TYPES } from '../../interfaces/types';

@Injectable()
export class AdminRecentActivityServiceImpl implements AdminRecentActivityService {
  constructor(
    @Inject(ADMIN_TYPES.repositories.AdminRecentActivityRepository)
    private readonly repository: AdminRecentActivityRepository,
  ) {}

  getRecentActivities(): Promise<RecentActivityResponseDto[]> {
    return this.repository.getRecentActivities();
  }
}
