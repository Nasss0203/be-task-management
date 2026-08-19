import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import { type CreateWorkspaceMemberService } from 'src/modules/workspace_member/interfaces/services/create-workspace-member.service.interface';
import { WORKSPACE_MEMBER_TYPES } from 'src/modules/workspace_member/interfaces/types';
import { type FindUserService } from 'src/modules/users/interfaces/services/find-user.service.interface';
import { USER_TYPES } from 'src/modules/users/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { type UpdateNotificationService } from 'src/modules/notifications/interfaces/services/update-notification.service.interface';
import { NOTIFICATION_TYPES } from 'src/modules/notifications/interfaces/types';
import {
  WorkspaceInviteStatus,
  WorkspaceInviteType,
} from '../domain/entities/workspace_invite.entity';
import { WorkspaceInviteResponseDto } from '../dto/response/workspace_invites-response.dto';
import {
  AcceptWorkspaceInviteApplication,
  AcceptWorkspaceInviteApplicationInput,
} from '../interfaces/applications/accept-workspace-invite.application.interface';
import { type AcceptWorkspaceInviteService } from '../interfaces/services/accept-workspace-invite.service.interface';
import { type FindWorkspaceInviteService } from '../interfaces/services/find-workspace-invite.service.interface';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';
import { WorkspaceInviteMapper } from '../mapper/workspace_invites.mapper';

@Injectable()
export class AcceptWorkspaceInviteApplicationImpl implements AcceptWorkspaceInviteApplication {
  constructor(
    @Inject(WORKSPACE_INVITE_TYPES.services.FindWorkspaceInviteService)
    private readonly findWorkspaceInviteService: FindWorkspaceInviteService,

    @Inject(WORKSPACE_INVITE_TYPES.services.AcceptWorkspaceInviteService)
    private readonly acceptWorkspaceInviteService: AcceptWorkspaceInviteService,

    @Inject(USER_TYPES.services.FindUserService)
    private readonly findUserService: FindUserService,

    @Inject(WORKSPACE_MEMBER_TYPES.services.CreateWorkspaceMemberService)
    private readonly createWorkspaceMemberService: CreateWorkspaceMemberService,

    @Inject(NOTIFICATION_TYPES.services.UpdateNotificationService)
    private readonly updateNotificationService: UpdateNotificationService,

    @Inject(WORKSPACE_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async acceptWorkspaceInvite(
    input: AcceptWorkspaceInviteApplicationInput,
  ): Promise<WorkspaceInviteResponseDto> {
    const token = input.token?.trim();

    if (!token) {
      throw new BadRequestException('token is required');
    }

    if (!input.userId) {
      throw new BadRequestException('userId is required');
    }

    const invite = await this.findWorkspaceInviteService.findByToken(token);

    if (!invite) {
      throw new NotFoundException('Workspace invite not found');
    }

    if (invite.status !== WorkspaceInviteStatus.PENDING) {
      throw new BadRequestException('Workspace invite is no longer valid');
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      throw new BadRequestException('Workspace invite has expired');
    }

    if (invite.max_uses && invite.used_count >= invite.max_uses) {
      throw new BadRequestException('Workspace invite usage limit reached');
    }

    const user = await this.findUserService.findUserById(input.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (invite.type === WorkspaceInviteType.EMAIL) {
      if (!input.email || !input.email.trim()) {
        throw new BadRequestException('email is required');
      }

      if (!invite.email) {
        throw new BadRequestException('Invite email is missing');
      }

      const inviteEmail = invite.email.trim().toLowerCase();
      const currentUserEmail = input.email.trim().toLowerCase();

      if (inviteEmail !== currentUserEmail) {
        throw new ForbiddenException(
          'This invite does not belong to the current account',
        );
      }

      if (invite.user_id && invite.user_id !== user.id) {
        throw new ForbiddenException(
          'This invite does not belong to the current user',
        );
      }
    }

    const acceptedInvite = await this.uow.runInTransaction(async (manager) => {
      await this.createWorkspaceMemberService.create(
        {
          workspace_id: invite.workspace_id,
          user_id: user.id,
          role_name: invite.role_name,
        },
        manager,
      );

      const acceptedInvite =
        await this.acceptWorkspaceInviteService.acceptWorkspaceInvite(
          {
            token,
            userId: user.id,
            email: input.email,
          },
          manager,
        );

      await this.updateNotificationService.updateInviteNotificationStatus(
        {
          inviteId: acceptedInvite.id,
          inviteStatus: acceptedInvite.status,
        },
        manager,
      );

      return acceptedInvite;
    });

    return WorkspaceInviteMapper.toResponse(acceptedInvite);
  }
}
