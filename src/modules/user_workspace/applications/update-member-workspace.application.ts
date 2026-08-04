import { Inject, Injectable } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { UpdateMemberWorkspaceApplication } from '../interfaces/applications/update-member-workspace.application.interface';
import { type UpdateMemberWorkspaceService } from '../interfaces/services/update-member-workspace.service.interface';
import { USER_WORKSPACE_TYPES } from '../interfaces/types';

@Injectable()
export class UpdateMemberWorkspaceApplicationImpl implements UpdateMemberWorkspaceApplication {
  constructor(
    @Inject(USER_WORKSPACE_TYPES.services.UpdateMemberWorkspaceService)
    private readonly updateMemberWorkspaceService: UpdateMemberWorkspaceService,

    @Inject(USER_WORKSPACE_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
  ) {}

  async updateRole(
    workspaceId: string,
    userId: string,
    roleName: RoleName,
    actorId: string,
  ): Promise<void> {
    return this.uow.runInTransaction(async (manager) => {
      await this.updateMemberWorkspaceService.updateRole(
        {
          workspace_id: workspaceId,
          user_id: userId,
          role_name: roleName,
          actor_id: actorId,
        },
        manager,
      );

      await this.createActivityService.create(
        {
          workspaceId,
          entityType: ActivityEntityType.WORKSPACE,
          entityId: workspaceId,
          actorId: actorId,
          action: ActivityAction.WORKSPACE_MEMBER_ROLE_CHANGED,
          metadata: {
            userId: userId,
            newRoleName: roleName,
          },
        },
        manager,
      );
    });
  }
}
