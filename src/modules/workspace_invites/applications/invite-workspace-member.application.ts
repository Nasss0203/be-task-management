import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MailService } from 'src/modules/mail/mail.service';
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
}
