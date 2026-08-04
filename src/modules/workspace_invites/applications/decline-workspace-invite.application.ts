import { Inject, Injectable } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import { WorkspaceInviteResponseDto } from '../dto/response/workspace_invites-response.dto';
import {
  DeclineWorkspaceInviteApplication,
  DeclineWorkspaceInviteApplicationInput,
} from '../interfaces/applications/decline-workspace-invite.application.interface';
import { type DeclineWorkspaceInviteService } from '../interfaces/services/decline-workspace-invite.service.interface';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';
import { WORKSPACE_TYPES } from '../../workspaces/interfaces/types';
import { WorkspaceInviteMapper } from '../mapper/workspace_invites.mapper';
import { type UpdateNotificationService } from 'src/modules/notifications/interfaces/services/update-notification.service.interface';
import { NOTIFICATION_TYPES } from 'src/modules/notifications/interfaces/types';

@Injectable()
export class DeclineWorkspaceInviteApplicationImpl implements DeclineWorkspaceInviteApplication {
  constructor(
    @Inject(WORKSPACE_INVITE_TYPES.services.DeclineWorkspaceInviteService)
    private readonly declineWorkspaceInviteService: DeclineWorkspaceInviteService,

    @Inject(NOTIFICATION_TYPES.services.UpdateNotificationService)
    private readonly updateNotificationService: UpdateNotificationService,

    @Inject(WORKSPACE_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async declineWorkspaceInvite(
    input: DeclineWorkspaceInviteApplicationInput,
  ): Promise<WorkspaceInviteResponseDto> {
    const declinedInvite = await this.uow.runInTransaction(async (manager) => {
      const invite =
        await this.declineWorkspaceInviteService.declineWorkspaceInvite(
          input,
          manager,
        );

      await this.updateNotificationService.updateInviteNotificationStatus(
        {
          inviteId: invite.id,
          inviteStatus: invite.status,
        },
        manager,
      );

      return invite;
    });

    return WorkspaceInviteMapper.toResponse(declinedInvite);
  }
}
