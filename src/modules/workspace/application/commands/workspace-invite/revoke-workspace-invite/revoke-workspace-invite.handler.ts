import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RevokeWorkspaceInviteCommand } from './revoke-workspace-invite.command';
import { WorkspaceInviteResponseDto } from 'src/modules/workspace/application/dto/workspace-invite/response/workspace-invite.response.dto';
import { WorkspaceInviteStatus } from 'src/modules/workspace/domain/enums/workspace-invite-status.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import type { WorkspaceInviteRepository } from 'src/modules/workspace/domain/repositories/workspace-invite.repository';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';

@Injectable()
export class RevokeWorkspaceInviteHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceInviteRepository)
    private readonly workspaceInviteRepository: WorkspaceInviteRepository,

    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,
  ) {}

  async execute(
    command: RevokeWorkspaceInviteCommand,
  ): Promise<WorkspaceInviteResponseDto> {
    const invite = await this.workspaceInviteRepository.findById(
      command.inviteId,
    );

    if (!invite || invite.getWorkspaceId() !== command.workspaceId) {
      throw new NotFoundException('Workspace invite not found');
    }

    const inviterMember =
      await this.workspaceMemberRepository.findByWorkspaceAndUser(
        command.workspaceId,
        command.revokedBy,
      );
    if (
      !inviterMember ||
      (inviterMember.getRole() !== WorkspaceRole.OWNER &&
        inviterMember.getRole() !== WorkspaceRole.ADMIN)
    ) {
      throw new ForbiddenException('Only owner or admin can revoke an invite');
    }

    if (invite.getStatus() !== WorkspaceInviteStatus.PENDING) {
      throw new BadRequestException('Can only revoke pending invites');
    }

    invite.markRevoked();
    const revoked = await this.workspaceInviteRepository.save(invite);

    return WorkspaceInviteResponseDto.fromDomain(revoked);
  }
}
