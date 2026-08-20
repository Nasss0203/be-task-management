import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { type UpdateNotificationService } from 'src/modules/notifications/interfaces/services/update-notification.service.interface';
import { NOTIFICATION_TYPES } from 'src/modules/notifications/interfaces/types';
import { type FindUserService } from 'src/modules/users/interfaces/services/find-user.service.interface';
import { USER_TYPES } from 'src/modules/users/interfaces/types';
import { WorkspaceInviteResponseDto } from 'src/modules/workspace/application/dto/workspace-invite/response/workspace-invite.response.dto';
import { WorkspaceInvite } from 'src/modules/workspace/domain/aggregates/workspace-invite/workspace-invite.aggregate';
import { WorkspaceMember } from 'src/modules/workspace/domain/aggregates/workspace-member/workspace-member.aggregate';
import { WorkspaceInviteStatus } from 'src/modules/workspace/domain/enums/workspace-invite-status.enum';
import { WorkspaceInviteType } from 'src/modules/workspace/domain/enums/workspace-invite-type.enum';
import type { WorkspaceInviteRepository } from 'src/modules/workspace/domain/repositories/workspace-invite.repository';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { AcceptWorkspaceInviteCommand } from './accept-workspace-invite.command';

@Injectable()
export class AcceptWorkspaceInviteHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceInviteRepository)
    private readonly workspaceInviteRepository: WorkspaceInviteRepository,

    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,

    @Inject(USER_TYPES.services.FindUserService)
    private readonly findUserService: FindUserService,

    @Inject(NOTIFICATION_TYPES.services.UpdateNotificationService)
    private readonly updateNotificationService: UpdateNotificationService,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(
    command: AcceptWorkspaceInviteCommand,
  ): Promise<WorkspaceInviteResponseDto> {
    const token = command.token?.trim();

    if (!token) {
      throw new BadRequestException('token is required');
    }

    if (!command.userId) {
      throw new BadRequestException('userId is required');
    }

    const invite = await this.workspaceInviteRepository.findByToken(token);

    if (!invite) {
      throw new NotFoundException('Workspace invite not found');
    }

    this.ensureInviteIsPendingUsable(invite);

    const user = await this.findUserService.findUserById(command.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingMember =
      await this.workspaceMemberRepository.findByWorkspaceAndUser(
        invite.getWorkspaceId(),
        user.id,
      );
    if (existingMember) {
      throw new BadRequestException(
        'You are already a member of this workspace',
      );
    }

    this.ensureInviteCanBeAccepted(invite, command, user.id);

    const acceptedInvite = await this.uow.runInTransaction(async (manager) => {
      const transactionalInvite =
        await this.workspaceInviteRepository.findByToken(token, manager);

      if (!transactionalInvite) {
        throw new NotFoundException('Workspace invite not found');
      }

      this.ensureInviteCanBeAccepted(transactionalInvite, command, user.id);

      await this.workspaceMemberRepository.save(
        WorkspaceMember.create({
          workspaceId: transactionalInvite.getWorkspaceId(),
          userId: user.id,
          role: transactionalInvite.getRoleName(),
        }),
        manager,
      );

      transactionalInvite.accept(user.id, new Date());

      const accepted = await this.workspaceInviteRepository.save(
        transactionalInvite,
        manager,
      );

      await this.updateNotificationService.updateInviteNotificationStatus(
        {
          inviteId: accepted.getId(),
          inviteStatus: accepted.getStatus(),
        },
        manager,
      );

      return accepted;
    });

    return WorkspaceInviteResponseDto.fromDomain(acceptedInvite);
  }

  private ensureInviteCanBeAccepted(
    invite: WorkspaceInvite,
    command: AcceptWorkspaceInviteCommand,
    userId: string,
  ): void {
    this.ensureInviteIsPendingUsable(invite);

    if (invite.getType() === WorkspaceInviteType.EMAIL) {
      if (!command.email || !command.email.trim()) {
        throw new BadRequestException('email is required');
      }

      const email = invite.getEmail();

      if (!email) {
        throw new BadRequestException('Invite email is missing');
      }

      const inviteEmail = email.trim().toLowerCase();
      const currentUserEmail = command.email.trim().toLowerCase();

      if (inviteEmail !== currentUserEmail) {
        throw new ForbiddenException(
          'This invite does not belong to the current account',
        );
      }

      const inviteUserId = invite.getUserId();

      if (inviteUserId && inviteUserId !== userId) {
        throw new ForbiddenException(
          'This invite does not belong to the current user',
        );
      }
    }
  }

  private ensureInviteIsPendingUsable(invite: WorkspaceInvite): void {
    if (invite.getStatus() !== WorkspaceInviteStatus.PENDING) {
      throw new BadRequestException('Workspace invite is no longer valid');
    }

    if (invite.getExpiresAt() && invite.getExpiresAt() < new Date()) {
      throw new BadRequestException('Workspace invite has expired');
    }

    const maxUses = invite.getMaxUses();

    if (maxUses && invite.getUsedCount() >= maxUses) {
      throw new BadRequestException('Workspace invite usage limit reached');
    }
  }
}
