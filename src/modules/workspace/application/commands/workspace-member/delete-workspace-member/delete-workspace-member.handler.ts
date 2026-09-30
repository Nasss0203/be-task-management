import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/application/ports/create-activity.service.port';
import { ACTIVITY_TYPES } from 'src/modules/activity/activity.types';
import type { UserProfilePreferenceService } from 'src/modules/identity/application/ports/user-profile-preference.service.interface';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { type UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { WorkspaceSoftDeleteService } from '../../../services/workspace-soft-delete.service';

import { DeleteWorkspaceMemberCommand } from './delete-workspace-member.command';

@Injectable()
export class DeleteWorkspaceMemberHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,

    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepository: WorkspaceRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,

    @Inject(IDENTITY_TYPES.services.UserProfilePreferenceService)
    private readonly userProfilePreferenceService: UserProfilePreferenceService,

    private readonly workspaceSoftDeleteService: WorkspaceSoftDeleteService,
  ) {}

  async execute(command: DeleteWorkspaceMemberCommand): Promise<void> {
    return this.uow.runInTransaction(async (manager) => {
      const targetMember =
        await this.workspaceMemberRepository.findByWorkspaceAndUser(
          command.workspaceId,
          command.userId,
          manager,
        );

      if (!targetMember) {
        throw new NotFoundException('Member not found in workspace');
      }

      const isSelfLeave = command.actorId === command.userId;

      if (!isSelfLeave) {
        const actorMember =
          await this.workspaceMemberRepository.findByWorkspaceAndUser(
            command.workspaceId,
            command.actorId,
            manager,
          );

        if (!actorMember) {
          throw new ForbiddenException('Actor is not in the workspace');
        }

        if (actorMember.getRole() !== WorkspaceRole.OWNER) {
          throw new ForbiddenException(
            'Only admin or owner can remove members',
          );
        }

        if (targetMember.getRole() === WorkspaceRole.OWNER) {
          throw new ForbiddenException(
            'Admins cannot remove Owners or other Admins',
          );
        }
      }

      if (isSelfLeave && targetMember.getRole() === WorkspaceRole.OWNER) {
        const allMembers = await this.workspaceMemberRepository.findByWorkspace(
          command.workspaceId,
          manager,
        );
        const ownerCount = allMembers.filter(
          (member) => member.getRole() === WorkspaceRole.OWNER,
        ).length;

        if (ownerCount <= 1) {
          await this.workspaceSoftDeleteService.execute(
            command.actorId,
            command.workspaceId,
            manager,
          );

          await this.updateLastActiveWorkspaceAfterLeave(
            command.userId,
            command.workspaceId,
            manager,
          );

          return;
        }
      }

      await this.workspaceMemberRepository.deleteByWorkspaceAndUser(
        command.workspaceId,
        command.userId,
        manager,
      );

      await this.updateLastActiveWorkspaceAfterLeave(
        command.userId,
        command.workspaceId,
        manager,
      );

      await this.createActivityService.create(
        {
          workspaceId: command.workspaceId,
          entityType: ActivityEntityType.WORKSPACE,
          entityId: command.workspaceId,
          actorId: command.actorId,
          action: ActivityAction.WORKSPACE_MEMBER_REMOVED,
          metadata: {
            userId: command.userId,
          },
        },
        manager,
      );
    });
  }

  private async updateLastActiveWorkspaceAfterLeave(
    userId: string,
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<void> {
    const lastActiveWorkspaceId =
      await this.userProfilePreferenceService.getLastActiveWorkspace(
        userId,
        context,
      );

    if (lastActiveWorkspaceId !== workspaceId) {
      return;
    }

    const activeWorkspaces = await this.workspaceRepository.findByUserId(
      userId,
      context,
    );
    const fallbackWorkspaceId = activeWorkspaces[0]?.getId() ?? null;

    await this.userProfilePreferenceService.updateLastActiveWorkspace(
      userId,
      fallbackWorkspaceId,
      context,
    );
  }
}
