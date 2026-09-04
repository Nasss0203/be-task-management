import { Inject, Injectable } from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import { AdminDashboardOverviewResponseDto } from '../../dto/response/admin-dashboard-overview.response.dto';
import type { AdminDashboardReader } from '../../ports/admin-dashboard-reader.port';
import { GetAdminDashboardOverviewQuery } from './get-admin-dashboard-overview.query';

@Injectable()
export class GetAdminDashboardOverviewHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.DashboardReader)
    private readonly adminDashboardReader: AdminDashboardReader,
  ) {}

  async execute(
    _query: GetAdminDashboardOverviewQuery,
  ): Promise<AdminDashboardOverviewResponseDto> {
    const overview = await this.adminDashboardReader.getOverview();

    return {
      totalUsers: overview.totalUsers,
      activeUsers: overview.activeUsers,
      inactiveUsers: overview.inactiveUsers,
      totalWorkspaces: overview.totalWorkspaces,
      archivedWorkspaces: overview.archivedWorkspaces,
      totalTeamspaces: overview.totalTeamspaces,
      totalPages: overview.totalPages,
      totalAttachments: overview.totalAttachments,
      storageBytes: overview.storageBytes,
    };
  }
}
