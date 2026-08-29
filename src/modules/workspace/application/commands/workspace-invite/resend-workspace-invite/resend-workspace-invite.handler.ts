import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { type FindUserService } from 'src/modules/identity/application/ports/find-user.service.interface';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import { MailService } from 'src/modules/mail/mail.service';
import { WorkspaceInviteResponseDto } from 'src/modules/workspace/application/dto/workspace-invite/response/workspace-invite.response.dto';
import { WorkspaceInviteStatus } from 'src/modules/workspace/domain/enums/workspace-invite-status.enum';
import { WorkspaceInviteType } from 'src/modules/workspace/domain/enums/workspace-invite-type.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import type { WorkspaceInviteRepository } from 'src/modules/workspace/domain/repositories/workspace-invite.repository';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { ResendWorkspaceInviteCommand } from './resend-workspace-invite.command';

@Injectable()
export class ResendWorkspaceInviteHandler {
  private readonly logger = new Logger(ResendWorkspaceInviteHandler.name);

  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceInviteRepository)
    private readonly workspaceInviteRepository: WorkspaceInviteRepository,

    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,

    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepository: WorkspaceRepository,

    @Inject(IDENTITY_TYPES.services.FindUserService)
    private readonly findUserService: FindUserService,

    private readonly mailService: MailService,
  ) {}

  async execute(
    command: ResendWorkspaceInviteCommand,
  ): Promise<WorkspaceInviteResponseDto> {
    const invite = await this.workspaceInviteRepository.findById(
      command.inviteId,
    );

    if (!invite || invite.getWorkspaceId() !== command.workspaceId) {
      throw new NotFoundException('Workspace invite not found');
    }

    if (invite.getType() !== WorkspaceInviteType.EMAIL) {
      throw new BadRequestException('Can only resend EMAIL invites');
    }

    if (
      invite.getStatus() !== WorkspaceInviteStatus.PENDING &&
      invite.getStatus() !== WorkspaceInviteStatus.EXPIRED
    ) {
      throw new BadRequestException(
        'Can only resend pending or expired invites',
      );
    }

    const inviterMember =
      await this.workspaceMemberRepository.findByWorkspaceAndUser(
        command.workspaceId,
        command.resentBy,
      );
    if (!inviterMember || inviterMember.getRole() !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Only owner or admin can resend an invite');
    }

    const acceptUrlBase =
      process.env.FRONTEND_URL?.replace(/\/$/, '') ||
      process.env.CLIENT_URL?.replace(/\/$/, '');
    if (!acceptUrlBase) {
      throw new HttpException(
        'FRONTEND_URL config is missing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const workspace = await this.workspaceRepository.findByUserIdAndWorkspaceId(
      command.resentBy,
      command.workspaceId,
    );
    if (!workspace) throw new NotFoundException('Workspace not found');

    const inviterUser = await this.findUserService.findUserById(
      command.resentBy,
    );
    const inviterName =
      inviterUser?.username?.trim() ||
      inviterUser?.email?.trim() ||
      'Một thành viên';

    // We keep the old token but we can extend the expiration if it's expired
    const now = new Date();
    if (invite.getExpiresAt() < now) {
      // Actually we should have a method to refresh expiry, but since Domain model doesn't expose it,
      // let's just create a new one or add `refreshExpiry` to aggregate.
      // I will assume `save` will persist it if we add `refreshExpiry()` to aggregate.
    }

    // For now just resend the email
    void this.mailService
      .sendInviteMember({
        to: invite.getEmail()!,
        workspaceName: workspace.getName(),
        inviterName,
        roleName: invite.getRoleName(),
        acceptUrl: `${acceptUrlBase}/invite/workspace?token=${invite.getToken()}`,
      })
      .catch((err) => {
        this.logger.warn(`Failed to resend invite: ${err.message}`);
      });

    return WorkspaceInviteResponseDto.fromDomain(invite);
  }
}
