import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { UpdateNotificationService } from 'src/modules/notifications/application/ports/update-notification.service.port';
import { NOTIFICATION_TYPES } from 'src/modules/notifications/notifications.types';

import { WorkspaceInviteResponseDto } from 'src/modules/workspace/application/dto/workspace-invite/response/workspace-invite.response.dto';

import { WorkspaceInviteStatus } from 'src/modules/workspace/domain/enums/workspace-invite-status.enum';
import { WorkspaceInviteType } from 'src/modules/workspace/domain/enums/workspace-invite-type.enum';

import type { WorkspaceInviteRepository } from 'src/modules/workspace/domain/repositories/workspace-invite.repository';

import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';

import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

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
      /**
       * 1. Validate input.
       */
      const token = command.token?.trim();

      if (!token) {
        throw new BadRequestException('token is required');
      }

      if (!command.userId) {
        throw new BadRequestException('userId is required');
      }

      /**
       * 2. Tìm WorkspaceInvite.
       */
      const invite = await this.workspaceInviteRepository.findByToken(
        token,
        manager,
      );

      if (!invite) {
        throw new NotFoundException('Workspace invite not found');
      }

      /**
       * 3. Chỉ PENDING mới được decline.
       */
      if (invite.getStatus() !== WorkspaceInviteStatus.PENDING) {
        throw new BadRequestException('Workspace invite is no longer valid');
      }

      /**
       * 4. Invite hết hạn không được decline.
       */
      if (invite.getExpiresAt() && invite.getExpiresAt()! < new Date()) {
        throw new BadRequestException('Workspace invite has expired');
      }

      /**
       * 5. Reusable LINK invite không được Decline.
       *
       * LINK có thể dùng bởi nhiều user.
       * Một user không được phép làm toàn bộ link
       * chuyển sang DECLINED.
       */
      if (invite.getType() === WorkspaceInviteType.LINK) {
        throw new BadRequestException(
          'Reusable workspace invite links cannot be declined',
        );
      }

      /**
       * 6. EMAIL invite phải thuộc đúng current user.
       */
      if (invite.getType() === WorkspaceInviteType.EMAIL) {
        /**
         * Nếu invite đã resolve được userId,
         * phải đúng chính account đang Decline.
         */
        const inviteUserId = invite.getUserId();

        if (inviteUserId && inviteUserId !== command.userId) {
          throw new ForbiddenException('This invite is not for your account');
        }

        /**
         * Đồng thời xác thực email.
         */
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

      /**
       * 7. PENDING -> DECLINED.
       *
       * Không tạo WorkspaceMembership.
       * Không promote GUEST -> MEMBER.
       */
      invite.markDeclined();

      const declined = await this.workspaceInviteRepository.save(
        invite,
        manager,
      );

      /**
       * 8. Đồng bộ notification workspace.invite.
       *
       * Sau khi Decline:
       * inviteStatus = DECLINED
       *
       * Frontend sẽ không còn hiển thị
       * Accept / Decline.
       */
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
