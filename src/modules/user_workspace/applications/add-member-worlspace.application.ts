import { Inject, Injectable } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { AddWorkspaceMemberDto } from '../dto/create-user_workspace.dto';
import { UserWorkspaceResponseDto } from '../dto/response/user_workspace.response.dto';
import { AddWorkspaceMemberApplication } from '../interfaces/applications/add-member-workspace.application.interface';
import { type AddMemberWorkspaceService } from '../interfaces/services/add-member-workspace.service.interface';
import { USER_WORKSPACE_TYPES } from '../interfaces/types';
import { UserWorkspaceMapper } from '../mapper/user_workspace.mapper';

@Injectable()
export class AddWorkspaceMemberApplicationImpl implements AddWorkspaceMemberApplication {
  constructor(
    @Inject(USER_WORKSPACE_TYPES.services.AddMemberWorkspaceService)
    private readonly addWorkspaceMemberService: AddMemberWorkspaceService,
    @Inject(USER_WORKSPACE_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
  ) {}

  async addMember(
    workspaceId: string,
    dto: AddWorkspaceMemberDto,
    addedBy: string,
  ): Promise<UserWorkspaceResponseDto> {
    return this.uow.runInTransaction(async (manager) => {
      const model = await this.addWorkspaceMemberService.addMember(
        {
          workspace_id: workspaceId,
          user_id: dto.user_id,
          role_name: dto.role_name,
          added_by: addedBy,
        },
        manager,
      );

      await this.createActivityService.create(
        {
          workspaceId,
          entityType: ActivityEntityType.WORKSPACE,
          entityId: workspaceId,
          actorId: addedBy,
          action: ActivityAction.WORKSPACE_MEMBER_JOINED,
          metadata: {
            userId: dto.user_id,
            roleName: dto.role_name,
          },
        },
        manager,
      );

      return UserWorkspaceMapper.toResponse(model);
    });
  }
}
