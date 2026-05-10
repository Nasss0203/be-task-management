import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  PlanTypeWorkspace,
  Workspace,
} from 'src/modules/workspaces/domain/entities/workspace.entity';
import { WorkspaceModel } from 'src/modules/workspaces/domain/models/workspaces.model';
import { WorkspaceMapper } from 'src/modules/workspaces/mapper/workspace.mapper';
import { EntityManager, Repository } from 'typeorm';
import { AdminUpdateWorkspacePlanRepository } from '../../interfaces/repositories/dashboard/admin-update-workspace-plan.repository.interface';

@Injectable()
export class AdminUpdateWorkspacePlanRepositoryImpl implements AdminUpdateWorkspacePlanRepository {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Workspace> {
    return manager ? manager.getRepository(Workspace) : this.workspaceRepo;
  }

  async updatePlan(
    workspaceId: string,
    planType: PlanTypeWorkspace,
    manager?: EntityManager,
  ): Promise<WorkspaceModel> {
    const repo = this.getRepo(manager);

    const workspace = await repo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    workspace.planType = planType;

    const savedWorkspace = await repo.save(workspace);

    return WorkspaceMapper.toModel(savedWorkspace);
  }
}
