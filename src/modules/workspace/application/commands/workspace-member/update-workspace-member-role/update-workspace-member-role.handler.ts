import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { type UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { UpdateWorkspaceMemberRoleCommand } from './update-workspace-member-role.command';

@Injectable()
export class UpdateWorkspaceMemberRoleHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
  ) {}

  async execute(command: UpdateWorkspaceMemberRoleCommand): Promise<void> {
    return this.uow.runInTransaction(async (manager) => {
      const actorMember =
        await this.workspaceMemberRepository.findByWorkspaceAndUser(
          command.workspaceId,
          command.actorId,
          manager,
        );

      if (!actorMember) {
        throw new ForbiddenException('Actor is not in the workspace');
      }

      if (![WorkspaceRole.OWNER].includes(actorMember.getRole())) {
        throw new ForbiddenException('Only admin or owner can update roles');
      }

      const targetMember =
        await this.workspaceMemberRepository.findByWorkspaceAndUser(
          command.workspaceId,
          command.userId,
          manager,
        );

      if (!targetMember) {
        throw new NotFoundException('Member not found in workspace');
      }

      if (
        targetMember.getRole() === WorkspaceRole.OWNER &&
        command.roleName !== WorkspaceRole.OWNER
      ) {
        const allMembers = await this.workspaceMemberRepository.findByWorkspace(
          command.workspaceId,
          manager,
        );
        const ownerCount = allMembers.filter(
          (member) => member.getRole() === WorkspaceRole.OWNER,
        ).length;

        if (ownerCount <= 1) {
          throw new BadRequestException(
            'Cannot change role of the last owner in the workspace',
          );
        }
      }

      targetMember.changeRole(command.roleName);

      await this.workspaceMemberRepository.save(targetMember, manager);

      await this.createActivityService.create(
        {
          workspaceId: command.workspaceId,
          entityType: ActivityEntityType.WORKSPACE,
          entityId: command.workspaceId,
          actorId: command.actorId,
          action: ActivityAction.WORKSPACE_MEMBER_ROLE_CHANGED,
          metadata: {
            userId: command.userId,
            newWorkspaceRole: command.roleName,
          },
        },
        manager,
      );
    });
  }
}
