import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
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
import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { type FindMemberService } from 'src/modules/user_workspace/interfaces/services/find-user-workspace.service.interface';
import { USER_WORKSPACE_TYPES } from 'src/modules/user_workspace/interfaces/types';
import { type FindUserService } from 'src/modules/users/interfaces/services/find-user.service.interface';
import { USER_TYPES } from 'src/modules/users/interfaces/types';
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
  constructor(
    @Inject(WORKSPACE_INVITE_TYPES.services.CreateWorkspaceInviteService)
    private readonly createWorkspaceInviteService: CreateWorkspaceInviteService,

    @Inject(USER_TYPES.services.FindUserService)
    private readonly findUserService: FindUserService,

    @Inject(NOTIFICATION_TYPES.services.CreateNotificationService)
    private readonly createNotificationService: CreateNotificationService,

    @Inject(USER_WORKSPACE_TYPES.services.FindMemberService)
    private readonly findMemberService: FindMemberService,

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

    const resolvedRecipients = await this.resolveRecipients(dto.recipients);

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
          message: `You have been invited to join Task Management.`,

          actionUrl: `/invite/workspace?token=${invite.token}`,

          metadata: {
            inviteId: invite.id,
            inviteToken: invite.token,
            inviteStatus: invite.status,
            workspaceId,
            workspaceName: 'Task Management',
            roleName: dto.role_name,
            invitedBy,
            email: recipient.email,
          },
        });
      }

      await this.mailService.sendEmailTemplates({
        to: recipient.email,
        subject: 'Lời mời tham gia workspace',
        template: 'invite-member',
        context: {
          recipientName: recipient.email,
          workspaceName: 'Task Management',
          inviterName: 'Nass',
          roleName: dto.role_name,
          acceptUrl: `http://localhost:3000/invite/workspace?token=${invite.token}`,
          expiredAt: '7 ngày kể từ lúc nhận email',
          year: new Date().getFullYear(),
          appName: 'Task Management',
        },
      });

      result.push(WorkspaceInviteMapper.toResponse(invite));
    }

    return result;
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
    roleName: RoleName,
  ): Promise<void> {
    if (![RoleName.OWNER, RoleName.ADMIN].includes(roleName)) return;

    const inviterMember = await this.findMemberService.findMemberInWorkspace(
      workspaceId,
      invitedBy,
    );

    if (!inviterMember || inviterMember.role_name !== RoleName.OWNER) {
      throw new ForbiddenException(
        'Only workspace owner can invite owner or admin members',
      );
    }
  }
}
