import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { WorkspaceOverviewResponseDto } from '../dto/response/workspace-overview.response.dto';
import { type FindWorkspaceOverviewRepository } from '../interfaces/repositories/find-workspace-overview.repository.interface';
import { FindWorkspaceOverviewService } from '../interfaces/services/find-workspace-overview.service.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';

@Injectable()
export class FindWorkspaceOverviewServiceImpl implements FindWorkspaceOverviewService {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.FindWorkspaceOverviewRepository)
    private readonly repo: FindWorkspaceOverviewRepository,
  ) {}

  findOverview(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceOverviewResponseDto> {
    return this.repo.findOverview(workspaceId, manager);
  }
}
