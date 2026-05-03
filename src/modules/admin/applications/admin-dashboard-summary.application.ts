import { Inject, Injectable } from '@nestjs/common';
import { DashboardSummaryResponseDto } from '../dto/response/dashboard-summary.response.dto';
import { AdminDashboardSummaryApplication } from '../interfaces/applications/admin-dashboard-summary.application.interface';
import { type AdminDashboardSummaryService } from '../interfaces/services/admin-dashboard-summary.service.interface';
import { ADMIN_TYPES } from '../interfaces/types';

@Injectable()
export class AdminDashboardSummaryApplicationImpl implements AdminDashboardSummaryApplication {
  constructor(
    @Inject(ADMIN_TYPES.services.AdminDashboardSummaryService)
    private readonly service: AdminDashboardSummaryService,
  ) {}

  async getSummary(): Promise<DashboardSummaryResponseDto> {
    const summary = await this.service.getSummary();

    return {
      totalUsers: summary.totalUsers,
      totalWorkspaces: summary.totalWorkspaces,
      totalProjects: summary.totalProjects,
      totalTasks: summary.totalTasks,
      paidWorkspaces: summary.paidWorkspaces,
    };
  }
}
