import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UnitOfWork } from 'src/interface/index.interface';
import { type UpdateNotificationService } from 'src/modules/notifications/interfaces/services/update-notification.service.interface';
import { NOTIFICATION_TYPES } from 'src/modules/notifications/interfaces/types';
import { WorkspaceInviteResponseDto } from 'src/modules/workspace/application/dto/workspace-invite/response/workspace-invite.response.dto';
import { WorkspaceInviteStatus } from 'src/modules/workspace/domain/enums/workspace-invite-status.enum';
import { WorkspaceInviteType } from 'src/modules/workspace/domain/enums/workspace-invite-type.enum';
import type { WorkspaceInviteRepository } from 'src/modules/workspace/domain/repositories/workspace-invite.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { DeclineWorkspaceInviteCommand } from './decline-workspace-invite.command';

@Injectable()
export class DeclineWorkspaceInviteHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceInviteRepository)
    private readonly workspaceInviteRepository: WorkspaceInviteRepository,

    @Inject(NOTIFICATION_TYPES.services.UpdateNotificationService)
    private readonly updateNotificationService: UpdateNotificationService,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(
    command: DeclineWorkspaceInviteCommand,
  ): Promise<WorkspaceInviteResponseDto> {
    const declinedInvite = await this.uow.runInTransaction(async (manager) => {
      const token = command.token?.trim();

      if (!token) {
        throw new BadRequestException('token is required');
      }

      if (!command.userId) {
        throw new BadRequestException('userId is required');
      }

      const invite = await this.workspaceInviteRepository.findByToken(
        token,
        manager,
      );

      if (!invite) {
        throw new NotFoundException('Workspace invite not found');
      }

      if (invite.getStatus() !== WorkspaceInviteStatus.PENDING) {
        throw new BadRequestException('Workspace invite is no longer valid');
      }

      if (invite.getExpiresAt() && invite.getExpiresAt() < new Date()) {
        throw new BadRequestException('Workspace invite has expired');
      }

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
          throw new ForbiddenException('This invite is not for your email');
        }
      }

      invite.markRevoked();

      const declined = await this.workspaceInviteRepository.save(
        invite,
        manager,
      );

      await this.updateNotificationService.updateInviteNotificationStatus(
        {
          inviteId: declined.getId(),
          inviteStatus: declined.getStatus(),
        },
        manager,
      );

      return declined;
    });

    return WorkspaceInviteResponseDto.fromDomain(declinedInvite);
  }
}
