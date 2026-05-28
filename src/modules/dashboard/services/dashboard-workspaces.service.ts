import { Inject, Injectable } from '@nestjs/common';
import { DashboardWorkspaceResponseDto } from '../dto/response/my-dashboard.response.dto';
import { type DashboardRepository } from '../interfaces/repositories/dashboard.repository.interface';
import { DashboardWorkspacesService } from '../interfaces/services/dashboard-workspaces.service.interface';
import { DASHBOARD_TYPES } from '../interfaces/types';

@Injectable()
export class DashboardWorkspacesServiceImpl implements DashboardWorkspacesService {
  constructor(
    @Inject(DASHBOARD_TYPES.repositories.DashboardRepository)
    private readonly dashboardRepository: DashboardRepository,
  ) {}

  async getRecentWorkspaces(
    userId: string,
    limit: number,
  ): Promise<DashboardWorkspaceResponseDto[]> {
    return this.dashboardRepository.findRecentWorkspaces(userId, limit);
  }
}
