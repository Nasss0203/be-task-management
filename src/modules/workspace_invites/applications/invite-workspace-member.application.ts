import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MailService } from 'src/modules/mail/mail.service';
import {
  NotificationSenderType,
  NotificationSourceType,
  NotificationType,
} from 'src/modules/notifications/domain/entities/notification.entity';
import { type CreateNotificationService } from 'src/modules/notifications/interfaces/services/create.notifications.service.interface';
import { NOTIFICATION_TYPES } from 'src/modules/notifications/interfaces/types';
import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';
import { type FindWorkspaceMemberService } from 'src/modules/workspace_member/interfaces/services/find-workspace-member.service.interface';
import { WORKSPACE_MEMBER_TYPES } from 'src/modules/workspace_member/interfaces/types';
import { type FindUserService } from 'src/modules/users/interfaces/services/find-user.service.interface';
import { USER_TYPES } from 'src/modules/users/interfaces/types';
import { type FindWorkspaceService } from 'src/modules/workspaces/interfaces/services/find.workspace.service.interface';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import {
  CreateWorkspaceInviteDto,
  InviteRecipientDto,
  InviteRecipientType,
} from '../dto/create-workspace_invite.dto';
import { WorkspaceInviteResponseDto } from '../dto/response/workspace_invites-response.dto';
import { InviteWorkspaceMemberApplication } from '../interfaces/applications/invite-workspace-member.application.interface';
import { type CreateWorkspaceInviteService } from '../interfaces/services/create-workspace_invite.service.interface';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';
import { WorkspaceInviteMapper } from '../mapper/workspace_invites.mapper';

@Injectable()
export class InviteWorkspaceMemberApplicationImpl implements InviteWorkspaceMemberApplication {
  private readonly logger = new Logger(
    InviteWorkspaceMemberApplicationImpl.name,
  );

  constructor(
    @Inject(WORKSPACE_INVITE_TYPES.services.CreateWorkspaceInviteService)
    private readonly createWorkspaceInviteService: CreateWorkspaceInviteService,

    @Inject(USER_TYPES.services.FindUserService)
    private readonly findUserService: FindUserService,

    @Inject(NOTIFICATION_TYPES.services.CreateNotificationService)
    private readonly createNotificationService: CreateNotificationService,

    @Inject(WORKSPACE_MEMBER_TYPES.services.FindWorkspaceMemberService)
    private readonly findMemberService: FindWorkspaceMemberService,

    @Inject(WORKSPACE_TYPES.services.FindWorkspaceService)
    private readonly findWorkspaceService: FindWorkspaceService,

    private readonly mailService: MailService,
  ) {}

  async invite(
    workspaceId: string,
    invitedBy: string,
    dto: CreateWorkspaceInviteDto,
  ): Promise<WorkspaceInviteResponseDto[]> {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    if (!invitedBy) {
      throw new BadRequestException('invitedBy is required');
    }

    if (!dto.role_name) {
      throw new BadRequestException('role_name is required');
    }

    await this.ensureCanInviteRole(workspaceId, invitedBy, dto.role_name);

    if (!dto.recipients || dto.recipients.length === 0) {
      throw new BadRequestException('recipients is required');
    }

    const [resolvedRecipients, workspace, inviterMember, inviterUser] =
      await Promise.all([
        this.resolveRecipients(dto.recipients),
        this.findWorkspaceService.findOneByWorkspaceId(invitedBy, workspaceId),
        this.findMemberService.findMemberInWorkspace(workspaceId, invitedBy),
        this.findUserService.findUserById(invitedBy),
      ]);

    const workspaceName = workspace.name;
    const inviterName =
      inviterMember?.full_name?.trim() ||
      inviterUser?.username?.trim() ||
      inviterMember?.email?.trim() ||
      inviterUser?.email?.trim() ||
      'Một thành viên';
    const inviterEmail = inviterMember?.email ?? inviterUser?.email ?? null;
    const acceptUrlBase = (
      process.env.FRONTEND_URL ||
      process.env.CLIENT_URL ||
      'http://localhost:3000'
    ).replace(/\/$/, '');

    const result: WorkspaceInviteResponseDto[] = [];

    for (const recipient of resolvedRecipients) {
      if (recipient.user_id && recipient.user_id === invitedBy) {
        throw new BadRequestException('You cannot invite yourself');
      }

      const invite = await this.createWorkspaceInviteService.save({
        workspace_id: workspaceId,
        user_id: recipient.user_id,
        email: recipient.email,
        role_name: dto.role_name,
        invited_by: invitedBy,
      });

      /**
       * In-app notification chỉ gửi được nếu recipient là user trong hệ thống.
       * Nếu recipient.user_id = null thì chỉ gửi email.
       */
      if (recipient.user_id) {
        await this.createNotificationService.createNotification({
          receiverId: recipient.user_id,
          senderType: NotificationSenderType.USER,
          actorId: invitedBy,
          sourceType: NotificationSourceType.WORKSPACE,
          workspaceId,
          projectId: null,
          taskId: null,
          sprintId: null,
          commentId: null,

          type: NotificationType.WORKSPACE_INVITE,

          title: 'Workspace invitation',
          message: `${inviterName} invited you to join ${workspaceName}.`,

          actionUrl: `/invite/workspace?token=${invite.token}`,

          metadata: {
            inviteId: invite.id,
            inviteToken: invite.token,
            inviteStatus: invite.status,
            workspaceId,
            workspaceName,
            roleName: dto.role_name,
            invitedBy,
            inviterName,
            inviterEmail,
            email: recipient.email,
          },
        });
      }

      this.queueInviteEmail({
        to: recipient.email,
        workspaceName,
        inviterName,
        roleName: dto.role_name,
        acceptUrl: `${acceptUrlBase}/invite/workspace?token=${invite.token}`,
      });

      result.push(WorkspaceInviteMapper.toResponse(invite));
    }

    return result;
  }

  private queueInviteEmail(input: {
    to: string;
    workspaceName: string;
    inviterName: string;
    roleName: string;
    acceptUrl: string;
  }): void {
    void this.mailService.sendInviteMember(input).catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Unknown mail transport error';

      this.logger.warn(
        `Workspace invite email failed for ${input.to}: ${message}`,
      );
    });
  }

  private async resolveRecipients(recipients: InviteRecipientDto[]): Promise<
    {
      user_id: string | null;
      email: string;
    }[]
  > {
    const map = new Map<
      string,
      {
        user_id: string | null;
        email: string;
      }
    >();

    for (const recipient of recipients) {
      const resolved = await this.resolveRecipient(recipient);

      map.set(resolved.email.toLowerCase(), resolved);
    }

    return Array.from(map.values());
  }

  private async resolveRecipient(recipient: InviteRecipientDto): Promise<{
    user_id: string | null;
    email: string;
  }> {
    if (recipient.type === InviteRecipientType.USER) {
      if (!recipient.user_id) {
        throw new BadRequestException('user_id is required');
      }

      const user = await this.findUserService.findUserById(recipient.user_id);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        user_id: user.id,
        email: user.email.trim().toLowerCase(),
      };
    }

    if (recipient.type === InviteRecipientType.EMAIL) {
      if (!recipient.email) {
        throw new BadRequestException('email is required');
      }

      return {
        user_id: null,
        email: recipient.email.trim().toLowerCase(),
      };
    }

    throw new BadRequestException('Invalid recipient type');
  }

  private async ensureCanInviteRole(
    workspaceId: string,
    invitedBy: string,
    roleName: WorkspaceRole,
  ): Promise<void> {
    if (![WorkspaceRole.OWNER, WorkspaceRole.ADMIN].includes(roleName)) return;

    const inviterMember = await this.findMemberService.findMemberInWorkspace(
      workspaceId,
      invitedBy,
    );

    if (!inviterMember || inviterMember.role_name !== WorkspaceRole.OWNER) {
      throw new ForbiddenException(
        'Only workspace owner can invite owner or admin members',
      );
    }
  }
}
