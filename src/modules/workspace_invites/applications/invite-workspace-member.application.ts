import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MailService } from 'src/modules/mail/mail.service';
import { type FindUserService } from 'src/modules/users/interfaces/services/find-user.service.interface';
import { USER_TYPES } from 'src/modules/users/interfaces/types';
import { CreateWorkspaceInviteDto } from '../dto/create-workspace_invite.dto';
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
  ): Promise<WorkspaceInviteResponseDto> {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    if (!invitedBy) {
      throw new BadRequestException('invitedBy is required');
    }

    if (!dto.user_id && !dto.email) {
      throw new BadRequestException('user_id or email is required');
    }

    let targetUserId: string | null = null;
    let targetEmail: string | null = null;

    if (dto.user_id) {
      const user = await this.findUserService.findUserById(dto.user_id);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      targetUserId = user.id;
      targetEmail = user.email.trim().toLowerCase();
    } else if (dto.email) {
      targetEmail = dto.email.trim().toLowerCase();
    }

    if (!targetEmail) {
      throw new BadRequestException('Target email is required');
    }

    // TODO:
    // 1. check invitedBy có quyền mời member trong workspace không
    // 2. check target user/email đã là member của workspace chưa
    // 3. check workspace đã có invite PENDING với email này chưa

    const invite = await this.createWorkspaceInviteService.save({
      workspace_id: workspaceId,
      user_id: targetUserId,
      email: targetEmail,
      role_name: dto.role_name,
      invited_by: invitedBy,
    });

    const email = await this.mailService.sendEmailTemplates({
      to: targetEmail,
      subject: 'Lời mời tham gia workspace',
      template: 'invite-member',
      context: {
        recipientName: targetEmail,
        workspaceName: 'Task Management',
        inviterName: 'Nass',
        roleName: dto.role_name,
        acceptUrl: `http://localhost:3000/invite/accept?token=${invite.token}`,
        expiredAt: '7 ngày kể từ lúc nhận email',
        year: new Date().getFullYear(),
        appName: 'Task Management',
      },
    });
    return WorkspaceInviteMapper.toResponse(invite);
  }
}
