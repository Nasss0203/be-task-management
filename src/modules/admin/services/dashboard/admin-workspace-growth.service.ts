import { Inject, Injectable } from '@nestjs/common';
import { WorkspaceGrowthQueryDto } from '../../dto/query/dashboard/workspace-growth-query.dto';
import { WorkspaceGrowthResponseDto } from '../../dto/response/dashboard/workspace-growth.response.dto';
import { type AdminWorkspaceGrowthRepository } from '../../interfaces/repositories/dashboard/admin-workspace-growth.repository.interface';
import { type AdminWorkspaceGrowthService } from '../../interfaces/services/dashboard/admin-workspace-growth.service.interface';
import { ADMIN_TYPES } from '../../interfaces/types';

@Injectable()
export class AdminWorkspaceGrowthServiceImpl implements AdminWorkspaceGrowthService {
  constructor(
    @Inject(ADMIN_TYPES.repositories.AdminWorkspaceGrowthRepository)
    private readonly repository: AdminWorkspaceGrowthRepository,
  ) {}

  getWorkspaceGrowth(
    query: WorkspaceGrowthQueryDto,
  ): Promise<WorkspaceGrowthResponseDto[]> {
    return this.repository.getWorkspaceGrowth(query);
  }
}
