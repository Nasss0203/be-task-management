import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';

import { DeleteWorkspaceMemberCommand } from './delete-workspace-member.command';

@Injectable()
export class DeleteWorkspaceMemberHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
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

        if (
          ![WorkspaceRole.OWNER, WorkspaceRole.ADMIN].includes(
            actorMember.getRole(),
          )
        ) {
          throw new ForbiddenException(
            'Only admin or owner can remove members',
          );
        }

        if (
          actorMember.getRole() === WorkspaceRole.ADMIN &&
          [WorkspaceRole.OWNER, WorkspaceRole.ADMIN].includes(
            targetMember.getRole(),
          )
        ) {
          throw new ForbiddenException(
            'Admins cannot remove Owners or other Admins',
          );
        }
      }

      if (targetMember.getRole() === WorkspaceRole.OWNER) {
        const allMembers = await this.workspaceMemberRepository.findByWorkspace(
          command.workspaceId,
          manager,
        );
        const ownerCount = allMembers.filter(
          (member) => member.getRole() === WorkspaceRole.OWNER,
        ).length;

        if (ownerCount <= 1) {
          throw new BadRequestException(
            'Cannot remove the last owner of the workspace. Please transfer ownership first.',
          );
        }
      }

      await this.workspaceMemberRepository.deleteByWorkspaceAndUser(
        command.workspaceId,
        command.userId,
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
}
