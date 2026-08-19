import { Inject, Injectable } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';

import { type UpdateWorkspaceMemberService } from '../../../interfaces/services/update-workspace-member.service.interface';
import { WORKSPACE_MEMBER_TYPES } from '../../../interfaces/types';
import { UpdateWorkspaceMemberRoleCommand } from './update-workspace-member-role.command';

@Injectable()
export class UpdateWorkspaceMemberRoleHandler {
  constructor(
    @Inject(WORKSPACE_MEMBER_TYPES.services.UpdateWorkspaceMemberService)
    private readonly updateWorkspaceMemberService: UpdateWorkspaceMemberService,

    @Inject(WORKSPACE_MEMBER_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
  ) {}

  async execute(command: UpdateWorkspaceMemberRoleCommand): Promise<void> {
    return this.uow.runInTransaction(async (manager) => {
      await this.updateWorkspaceMemberService.updateRole(
        {
          workspace_id: command.workspaceId,
          user_id: command.userId,
          role_name: command.roleName,
          actor_id: command.actorId,
        },
        manager,
      );

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
