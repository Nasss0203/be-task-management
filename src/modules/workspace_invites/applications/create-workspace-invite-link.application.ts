import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';
import { type FindWorkspaceMemberService } from 'src/modules/workspace_member/interfaces/services/find-workspace-member.service.interface';
import { WORKSPACE_MEMBER_TYPES } from 'src/modules/workspace_member/interfaces/types';
import {
  WorkspaceInviteStatus,
  WorkspaceInviteType,
} from '../domain/entities/workspace_invite.entity';

import { CreateWorkspaceInviteLinkDto } from '../dto/create-workspace_invite.dto';
import { WorkspaceInviteLinkResponseDto } from '../dto/response/workspace-invite-link-response.dto';
import { CreateWorkspaceInviteLinkApplication } from '../interfaces/applications/create-workspace-invite-link.application.interface';
import { type CreateWorkspaceInviteRepository } from '../interfaces/repositories/create-workspace_invite.repository.interface';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';

@Injectable()
export class CreateWorkspaceInviteLinkApplicationImpl implements CreateWorkspaceInviteLinkApplication {
  constructor(
    @Inject(WORKSPACE_INVITE_TYPES.repositories.CreateWorkspaceInviteRepository)
    private readonly createWorkspaceInviteRepository: CreateWorkspaceInviteRepository,

    @Inject(WORKSPACE_MEMBER_TYPES.services.FindWorkspaceMemberService)
    private readonly findMemberService: FindWorkspaceMemberService,
  ) {}

  async createLink(
    workspaceId: string,
    invitedBy: string,
    dto: CreateWorkspaceInviteLinkDto,
  ): Promise<WorkspaceInviteLinkResponseDto> {
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

    const now = new Date();

    const expiresAt = new Date(
      now.getTime() + (dto.expires_in_days ?? 7) * 24 * 60 * 60 * 1000,
    );

    const invite = await this.createWorkspaceInviteRepository.save({
      workspace_id: workspaceId,
      user_id: null,
      email: null,
      type: WorkspaceInviteType.LINK,
      role_name: dto.role_name,
      invited_by: invitedBy,
      token: randomUUID(),
      status: WorkspaceInviteStatus.PENDING,
      expires_at: expiresAt,
      max_uses: dto.max_uses ?? null,
      used_count: 0,
    });

    return {
      id: invite.id,
      workspace_id: invite.workspace_id,
      role_name: invite.role_name,
      token: invite.token,
      invite_url: `http://localhost:3000/invite/workspace?token=${invite.token}`,
      expires_at: invite.expires_at,
      max_uses: invite.max_uses,
      used_count: invite.used_count,
    };
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
        'Only workspace owner can create owner or admin invite links',
      );
    }
  }
}
