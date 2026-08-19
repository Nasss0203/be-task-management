import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import { type CreatePageService } from 'src/modules/page/interfaces/services/create.page.service.interface';
import { PAGE_TYPES } from 'src/modules/page/interfaces/types';
import { type CreateWorkspaceMemberService } from 'src/modules/workspace_member/interfaces/services/create-workspace-member.service.interface';
import { WORKSPACE_MEMBER_TYPES } from 'src/modules/workspace_member/interfaces/types';
import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';
import { generateSlug } from 'src/utils';
import { EntityManager } from 'typeorm';
import {
  PlanTypeWorkspace,
  WorkspaceLayoutMode,
} from '../domain/entities/workspace.entity';
import { WorkspaceModel } from '../domain/models/workspaces.model';
import { type CreateWorkspaceMultiRepository } from '../interfaces/repositories/create-workspace.repository.interface';
import { CreateWorkspaceService } from '../interfaces/services/create-workspace.service.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';

@Injectable()
export class CreateWorkspaceServiceImpl implements CreateWorkspaceService {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepo: CreateWorkspaceMultiRepository,

    @Inject(WORKSPACE_MEMBER_TYPES.services.CreateWorkspaceMemberService)
    private readonly createWorkspaceMemberService: CreateWorkspaceMemberService,

    @Inject(PAGE_TYPES.services.CreatePageService)
    private readonly createPageService: CreatePageService,

    @Inject(WORKSPACE_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async createDefault({
    userId,
    manager,
  }: {
    userId: string;
    manager?: EntityManager;
  }): Promise<WorkspaceModel> {
    const create = async (transactionManager: EntityManager) => {
      const workspace = await this.createWorkspaceCoreDefault({
        name: 'Task management',
        planType: PlanTypeWorkspace.FREE,
        userId,
        manager: transactionManager,
      });

      await this.createPageService.createDefault(
        {
          workspace_id: workspace.id,
          title: workspace.name,
          slug: workspace.slug,
          created_by: userId,
        },
        transactionManager,
      );

      return workspace;
    };

    if (manager) {
      return create(manager);
    }

    return this.uow.runInTransaction(create);
  }

  private async createWorkspaceCoreDefault({
    name,
    planType,
    userId,
    manager,
  }: {
    name: string;
    planType?: PlanTypeWorkspace;
    userId: string;
    manager: EntityManager;
  }): Promise<WorkspaceModel> {
    const baseSlug = generateSlug(name).toLowerCase();
    const slug = `${baseSlug}-${userId.slice(0, 6)}-${Date.now()}`;

    const exists = await this.workspaceRepo.existsBySlug(slug, manager);
    if (exists) {
      throw new HttpException(
        'Workspace slug already exists',
        HttpStatus.CONFLICT,
      );
    }

    const workspace = await this.workspaceRepo.save(
      {
        name,
        slug,
        planType: planType ?? PlanTypeWorkspace.FREE,
        layoutMode: WorkspaceLayoutMode.TABS,
        createdBy: userId,
      },
      manager,
    );

    await this.createWorkspaceMemberService.create(
      {
        user_id: userId,
        workspace_id: workspace.id,
        role_name: WorkspaceRole.OWNER,
      },
      manager,
    );

    return workspace;
  }
}
