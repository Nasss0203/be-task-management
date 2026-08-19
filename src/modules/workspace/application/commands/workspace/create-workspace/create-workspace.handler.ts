import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import type { UnitOfWork } from 'src/interface/index.interface';
import type { CreatePageService } from 'src/modules/page/interfaces/services/create.page.service.interface';
import { PAGE_TYPES } from 'src/modules/page/interfaces/types';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import { Workspace } from 'src/modules/workspace/domain/aggregates/workspace/workspace.aggregate';
import { WorkspaceLayoutMode } from 'src/modules/workspace/domain/enums/workspace-layout-mode.enum';
import { PlanTypeWorkspace } from 'src/modules/workspace/domain/enums/workspace-plan-type.enum';
import { WorkspaceMember } from 'src/modules/workspace/domain/aggregates/workspace-member/workspace-member.aggregate';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { generateSlug } from 'src/utils';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import { WorkspaceResponseDto } from 'src/modules/workspace/application/dto/workspace/response/workspaces.response.dto';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { CreateWorkspaceCommand } from './create-workspace.command';

@Injectable()
export class CreateWorkspaceHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepository: WorkspaceRepository,

    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,

    @Inject(PAGE_TYPES.services.CreatePageService)
    private readonly createPageService: CreatePageService,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(
    command: CreateWorkspaceCommand,
  ): Promise<WorkspaceResponseDto> {
    const workspace = await this.createDefault(command.userId, command.manager);

    return WorkspaceResponseDto.fromDomain(workspace);
  }

  private async createDefault(
    userId: string,
    manager?: EntityManager,
  ): Promise<Workspace> {
    const create = async (transactionManager: EntityManager) => {
      const workspace = await this.createWorkspaceCoreDefault({
        name: 'Task management',
        planType: PlanTypeWorkspace.FREE,
        userId,
        manager: transactionManager,
      });

      await this.createPageService.createDefault(
        {
          workspace_id: workspace.getId(),
          title: workspace.getName(),
          slug: workspace.getSlug(),
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
  }): Promise<Workspace> {
    const baseSlug = generateSlug(name).toLowerCase();
    const slug = `${baseSlug}-${userId.slice(0, 6)}-${Date.now()}`;

    const exists = await this.workspaceRepository.existsBySlug(slug, manager);

    if (exists) {
      throw new HttpException(
        'Workspace slug already exists',
        HttpStatus.CONFLICT,
      );
    }

    const workspace = await this.workspaceRepository.save(
      Workspace.create({
        name,
        slug,
        planType: planType ?? PlanTypeWorkspace.FREE,
        layoutMode: WorkspaceLayoutMode.TABS,
        createdBy: userId,
      }),
      manager,
    );

    await this.workspaceMemberRepository.save(
      WorkspaceMember.create({
        userId,
        workspaceId: workspace.getId(),
        role: WorkspaceRole.OWNER,
      }),
      manager,
    );

    return workspace;
  }
}
