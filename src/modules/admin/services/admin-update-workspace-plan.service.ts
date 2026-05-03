import { Inject, Injectable } from '@nestjs/common';
import { PlanTypeWorkspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import { WorkspaceModel } from 'src/modules/workspaces/domain/models/workspaces.model';
import { EntityManager } from 'typeorm';
import { type AdminUpdateWorkspacePlanRepository } from '../interfaces/repositories/admin-update-workspace-plan.repository.interface';
import { AdminUpdateWorkspacePlanService } from '../interfaces/services/admin-update-workspace-plan.service.interface';
import { ADMIN_TYPES } from '../interfaces/types';

@Injectable()
export class AdminUpdateWorkspacePlanServiceImpl implements AdminUpdateWorkspacePlanService {
  constructor(
    @Inject(ADMIN_TYPES.repositories.AdminUpdateWorkspacePlanRepository)
    private readonly repo: AdminUpdateWorkspacePlanRepository,
  ) {}
  updatePlan(
    workspaceId: string,
    planType: PlanTypeWorkspace,
    manager?: EntityManager,
  ): Promise<WorkspaceModel> {
    return this.repo.updatePlan(workspaceId, planType, manager);
  }
}
