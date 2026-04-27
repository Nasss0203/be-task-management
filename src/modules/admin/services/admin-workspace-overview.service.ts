import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { WorkspaceOverviewModel } from '../domain/models/workspace-overview.model';
import { type AdminWorkspaceOverviewRepository } from '../interfaces/repositories/admin-workspace-overview.repository.interface';
import { AdminWorkspaceOverviewService } from '../interfaces/services/admin-workspace-overview.service.interface';
import { ADMIN_TYPES } from '../interfaces/types';

@Injectable()
export class AdminWorkspaceOverviewServiceImpl implements AdminWorkspaceOverviewService {
  constructor(
    @Inject(ADMIN_TYPES.repositories.AdminWorkspaceOverviewRepository)
    private readonly repo: AdminWorkspaceOverviewRepository,
  ) {}

  getOverview(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceOverviewModel> {
    return this.repo.getOverview(workspaceId, manager);
  }
}
