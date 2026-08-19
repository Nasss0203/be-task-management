import { Inject, Injectable } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';

import { WorkspaceMemberResponseDto } from '../../../dto/response/workspace-member.response.dto';
import { type AddWorkspaceMemberService } from '../../../interfaces/services/add-workspace-member.service.interface';
import { WORKSPACE_MEMBER_TYPES } from '../../../interfaces/types';
import { WorkspaceMemberMapper } from '../../../mapper/workspace-member.mapper';
import { AddWorkspaceMemberCommand } from './add-workspace-member.command';

@Injectable()
export class AddWorkspaceMemberHandler {
  constructor(
    @Inject(WORKSPACE_MEMBER_TYPES.services.AddWorkspaceMemberService)
    private readonly addWorkspaceMemberService: AddWorkspaceMemberService,

    @Inject(WORKSPACE_MEMBER_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
  ) {}

  async execute(
    command: AddWorkspaceMemberCommand,
  ): Promise<WorkspaceMemberResponseDto> {
    return this.uow.runInTransaction(async (manager) => {
      const model = await this.addWorkspaceMemberService.addMember(
        {
          workspace_id: command.workspaceId,
          user_id: command.userId,
          role_name: command.roleName,
          added_by: command.addedBy,
        },
        manager,
      );

      await this.createActivityService.create(
        {
          workspaceId: command.workspaceId,
          entityType: ActivityEntityType.WORKSPACE,
          entityId: command.workspaceId,
          actorId: command.addedBy,
          action: ActivityAction.WORKSPACE_MEMBER_JOINED,
          metadata: {
            userId: command.userId,
            roleName: command.roleName,
          },
        },
        manager,
      );

      return WorkspaceMemberMapper.toResponse(model);
    });
  }
}
