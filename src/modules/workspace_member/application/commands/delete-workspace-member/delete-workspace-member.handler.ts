import { Inject, Injectable } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';

import { type DeleteWorkspaceMemberService } from '../../../interfaces/services/delete-workspace-member.service.interface';
import { WORKSPACE_MEMBER_TYPES } from '../../../interfaces/types';
import { DeleteWorkspaceMemberCommand } from './delete-workspace-member.command';

@Injectable()
export class DeleteWorkspaceMemberHandler {
  constructor(
    @Inject(WORKSPACE_MEMBER_TYPES.services.DeleteWorkspaceMemberService)
    private readonly deleteWorkspaceMemberService: DeleteWorkspaceMemberService,

    @Inject(WORKSPACE_MEMBER_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
  ) {}

  async execute(command: DeleteWorkspaceMemberCommand): Promise<void> {
    return this.uow.runInTransaction(async (manager) => {
      await this.deleteWorkspaceMemberService.deleteMember(
        {
          workspace_id: command.workspaceId,
          user_id: command.userId,
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
