import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CreateWorkspaceInviteLinkDto } from 'src/modules/workspace/application/dto/workspace-invite/create-workspace-invite.dto';
import { WorkspaceInviteLinkResponseDto } from 'src/modules/workspace/application/dto/workspace-invite/response/workspace-invite-link-response.dto';
import { WorkspaceInvite } from 'src/modules/workspace/domain/aggregates/workspace-invite/workspace-invite.aggregate';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import type { WorkspaceInviteRepository } from 'src/modules/workspace/domain/repositories/workspace-invite.repository';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { CreateWorkspaceInviteLinkCommand } from './create-workspace-invite-link.command';

@Injectable()
export class CreateWorkspaceInviteLinkHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceInviteRepository)
    private readonly workspaceInviteRepository: WorkspaceInviteRepository,

    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,
  ) {}

  async execute(
    command: CreateWorkspaceInviteLinkCommand,
  ): Promise<WorkspaceInviteLinkResponseDto> {
    const { workspaceId, invitedBy, dto } = command;

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

    const invite = await this.createLinkInvite(workspaceId, invitedBy, dto);

    const acceptUrlBase =
      process.env.FRONTEND_URL?.replace(/\/$/, '') ||
      process.env.CLIENT_URL?.replace(/\/$/, '');
    if (!acceptUrlBase) {
      throw new HttpException(
        'FRONTEND_URL config is missing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const inviteUrl = `${acceptUrlBase}/invite/workspace?token=${invite.getToken()}`;

    return WorkspaceInviteLinkResponseDto.fromDomain(invite, inviteUrl);
  }

  private async createLinkInvite(
    workspaceId: string,
    invitedBy: string,
    dto: CreateWorkspaceInviteLinkDto,
  ) {
    const now = new Date();

    const expiresAt = new Date(
      now.getTime() + (dto.expires_in_days ?? 7) * 24 * 60 * 60 * 1000,
    );

    return this.workspaceInviteRepository.save(
      WorkspaceInvite.createLink({
        workspaceId,
        roleName: dto.role_name,
        invitedBy,
        expiresAt,
        maxUses: dto.max_uses ?? null,
      }),
    );
  }

  private async ensureCanInviteRole(
    workspaceId: string,
    invitedBy: string,
    roleName: WorkspaceRole,
  ): Promise<void> {
    if (![WorkspaceRole.OWNER].includes(roleName)) return;

    const inviterMember =
      await this.workspaceMemberRepository.findByWorkspaceAndUser(
        workspaceId,
        invitedBy,
      );

    if (!inviterMember || inviterMember.getRole() !== WorkspaceRole.OWNER) {
      throw new ForbiddenException(
        'Only workspace owner can create owner or admin invite links',
      );
    }
  }
}
