import { ConflictException, Inject, Injectable } from '@nestjs/common';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { WorkspaceResponseDto } from 'src/modules/workspace/application/dto/workspace/response/workspaces.response.dto';
import { WorkspaceMember } from 'src/modules/workspace/domain/aggregates/workspace-member/workspace-member.aggregate';
import { Workspace } from 'src/modules/workspace/domain/aggregates/workspace/workspace.aggregate';
import { WorkspaceLayoutMode } from 'src/modules/workspace/domain/enums/workspace-layout-mode.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { generateSlug } from 'src/utils';
import { CreateWorkspaceCommand } from './create-workspace.command';
import type { ContentPageProvisioningPort } from 'src/modules/content/application/ports/content-page-provisioning.port';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

@Injectable()
export class CreateWorkspaceHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepository: WorkspaceRepository,

    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,

    @Inject(CONTENT_TYPES.ports.PageProvisioning)
    private readonly pageProvisioningPort: ContentPageProvisioningPort,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(
    command: CreateWorkspaceCommand,
  ): Promise<WorkspaceResponseDto> {
    const workspace = await this.uow.runInTransaction(async (context) => {
      const createdWorkspace = await this.createWorkspaceCoreDefault(
        { name: 'Task management', userId: command.userId },
        context,
      );

      await this.pageProvisioningPort.createDefaultPage(
        {
          workspaceId: createdWorkspace.getId(),
          title: createdWorkspace.getName(),
          slug: createdWorkspace.getSlug(),
          createdBy: command.userId,
          isTemplate: false,
        },
        context,
      );

      return createdWorkspace;
    });

    return WorkspaceResponseDto.fromDomain(workspace);
  }

  private async createWorkspaceCoreDefault(
    { name, userId }: { name: string; userId: string },
    context?: PersistenceContext,
  ): Promise<Workspace> {
    const baseSlug = generateSlug(name).toLowerCase();
    const slug = `${baseSlug}-${userId.slice(0, 6)}-${Date.now()}`;

    const exists = await this.workspaceRepository.existsBySlug(slug, context);

    if (exists) {
      throw new ConflictException('Workspace slug already exists');
    }

    const workspace = await this.workspaceRepository.save(
      Workspace.create({
        name,
        slug,
        layoutMode: WorkspaceLayoutMode.TABS,
        createdBy: userId,
      }),
      context,
    );

    await this.workspaceMemberRepository.save(
      WorkspaceMember.create({
        userId,
        workspaceId: workspace.getId(),
        role: WorkspaceRole.OWNER,
      }),
      context,
    );

    return workspace;
  }
}
