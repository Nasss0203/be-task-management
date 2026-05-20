import { Inject, Injectable } from '@nestjs/common';
import { WorkspaceGrowthQueryDto } from '../../dto/query/dashboard/workspace-growth-query.dto';
import { WorkspaceGrowthResponseDto } from '../../dto/response/dashboard/workspace-growth.response.dto';
import { type AdminWorkspaceGrowthApplication } from '../../interfaces/applications/dashboard/admin-workspace-growth.application.interface';
import { type AdminWorkspaceGrowthService } from '../../interfaces/services/dashboard/admin-workspace-growth.service.interface';
import { ADMIN_TYPES } from '../../interfaces/types';

@Injectable()
export class AdminWorkspaceGrowthApplicationImpl implements AdminWorkspaceGrowthApplication {
  constructor(
    @Inject(ADMIN_TYPES.services.AdminWorkspaceGrowthService)
    private readonly service: AdminWorkspaceGrowthService,
  ) {}

  getWorkspaceGrowth(
    query: WorkspaceGrowthQueryDto,
  ): Promise<WorkspaceGrowthResponseDto[]> {
    return this.service.getWorkspaceGrowth(query);
  }
}
