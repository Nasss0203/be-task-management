import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationSenderType,
  NotificationSourceType,
  NotificationType,
} from 'src/modules/notifications/domain/entities/notification.entity';
import type { CreateNotificationService } from 'src/modules/notifications/application/ports/create-notification.service.port';
import { NOTIFICATION_TYPES } from 'src/modules/notifications/notifications.types';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/application/ports/create-activity.service.port';
import { ACTIVITY_TYPES } from 'src/modules/activity/activity.types';
import type { UserProfilePreferenceService } from 'src/modules/identity/application/ports/user-profile-preference.service.interface';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import type {
  TeamspaceHandover,
  TeamspaceOwnershipGuard,
} from 'src/modules/workspace/application/ports/teamspace-ownership-guard.port';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { type UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { BILLING_TYPES } from 'src/modules/billing/billing.types';
import type { SubscriptionLifecyclePort } from 'src/modules/billing/application/ports/subscription-lifecycle.port';
import { WorkspaceSoftDeleteService } from '../../../services/workspace-soft-delete.service';

import { DeleteWorkspaceMemberCommand } from './delete-workspace-member.command';

@Injectable()
export class DeleteWorkspaceMemberHandler {
  private readonly logger = new Logger(DeleteWorkspaceMemberHandler.name);

  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,

    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepository: WorkspaceRepository,

    @Inject(WORKSPACE_TYPES.ports.TeamspaceOwnershipGuard)
    private readonly teamspaceOwnershipGuard: TeamspaceOwnershipGuard,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,

    @Inject(IDENTITY_TYPES.services.UserProfilePreferenceService)
    private readonly userProfilePreferenceService: UserProfilePreferenceService,

    private readonly workspaceSoftDeleteService: WorkspaceSoftDeleteService,

    @Inject(BILLING_TYPES.services.SubscriptionLifecyclePort)
    private readonly subscriptionLifecycle: SubscriptionLifecyclePort,

    @Inject(NOTIFICATION_TYPES.services.CreateNotificationService)
    private readonly notifications: CreateNotificationService,
  ) {}

  async execute(command: DeleteWorkspaceMemberCommand): Promise<void> {
    const handovers = await this.uow.runInTransaction(async (manager) => {
      const isSelfLeave = command.actorId === command.userId;

      if (!isSelfLeave) {
        await this.workspaceMemberRepository.lockMembersForUpdate(
          command.workspaceId,
          [command.userId, command.actorId],
          manager,
        );
      }

      const targetMember =
        await this.workspaceMemberRepository.findByWorkspaceAndUser(
          command.workspaceId,
          command.userId,
          manager,
        );

      if (!targetMember) {
        throw new NotFoundException('Member not found in workspace');
      }

      if (!isSelfLeave) {
        const actorMember =
          await this.workspaceMemberRepository.findByWorkspaceAndUser(
            command.workspaceId,
            command.actorId,
            manager,
          );

        if (!actorMember) {
          throw new ForbiddenException('Actor is not in the workspace');
        }

        if (actorMember.getRole() !== WorkspaceRole.OWNER) {
          throw new ForbiddenException(
            'Only admin or owner can remove members',
          );
        }
      }

      if (isSelfLeave && targetMember.getRole() === WorkspaceRole.OWNER) {
        const allMembers = await this.workspaceMemberRepository.findByWorkspace(
          command.workspaceId,
          manager,
        );
        const ownerCount = allMembers.filter(
          (member) => member.getRole() === WorkspaceRole.OWNER,
        ).length;

        if (ownerCount <= 1) {
          await this.workspaceSoftDeleteService.execute(
            command.actorId,
            command.workspaceId,
            manager,
          );

          await this.updateLastActiveWorkspaceAfterLeave(
            command.userId,
            command.workspaceId,
            manager,
          );

          return [];
        }
      }

      let teamspaceHandovers: TeamspaceHandover[] = [];
      if (isSelfLeave) {
        await this.teamspaceOwnershipGuard.assertCanRemoveWorkspaceMember(
          command.workspaceId,
          targetMember.getId(),
          manager,
        );
      } else {
        teamspaceHandovers =
          await this.teamspaceOwnershipGuard.handOverTeamspacesOf(
            command.workspaceId,
            targetMember.getId(),
            command.userId,
            manager,
          );
      }

      await this.workspaceMemberRepository.deleteByWorkspaceAndUser(
        command.workspaceId,
        command.userId,
        manager,
      );
      await this.subscriptionLifecycle.handleBillingContactLeft(
        command.workspaceId,
        command.userId,
        manager,
      );

      await this.updateLastActiveWorkspaceAfterLeave(
        command.userId,
        command.workspaceId,
        manager,
      );

      await this.createActivityService.create(
        {
          workspaceId: command.workspaceId,
          entityType: ActivityEntityType.WORKSPACE,
          entityId: command.workspaceId,
          actorId: command.actorId,
          action: ActivityAction.WORKSPACE_MEMBER_REMOVED,
          metadata: {
            userId: command.userId,
          },
        },
        manager,
      );

      for (const handover of teamspaceHandovers) {
        await this.createActivityService.create(
          {
            workspaceId: command.workspaceId,
            entityType: ActivityEntityType.TEAMSPACE,
            entityId: handover.teamspaceId,
            actorId: command.actorId,
            ...(handover.newOwnerWorkspaceMemberId
              ? {
                  action: ActivityAction.TEAMSPACE_MEMBER_ROLE_CHANGED,
                  metadata: {
                    workspaceMemberId: handover.newOwnerWorkspaceMemberId,
                    from: TeamspaceRole.MEMBER,
                    to: TeamspaceRole.OWNER,
                    reason: 'previous_owner_removed_from_workspace',
                  },
                }
              : {
                  action: ActivityAction.TEAMSPACE_ARCHIVED,
                  metadata: { reason: 'last_member_removed_from_workspace' },
                }),
          },
          manager,
        );
      }

      return teamspaceHandovers;
    });

    for (const handover of handovers) {
      if (handover.newOwnerUserId) {
        await this.notifyNewTeamspaceOwner(command, handover);
      }
    }
  }

  private async notifyNewTeamspaceOwner(
    command: DeleteWorkspaceMemberCommand,
    handover: TeamspaceHandover,
  ): Promise<void> {
    try {
      await this.notifications.createNotification({
        receiverId: handover.newOwnerUserId as string,
        senderType: NotificationSenderType.USER,
        actorId: command.actorId,
        sourceType: NotificationSourceType.TEAMSPACE,
        sourceId: handover.teamspaceId,
        workspaceId: command.workspaceId,
        type: NotificationType.TEAMSPACE_OWNERSHIP_TRANSFERRED,
        title: 'Bạn là owner mới của Teamspace',
        message: `Owner trước đã rời workspace, bạn được chuyển quyền owner của Teamspace "${handover.teamspaceName}".`,
        metadata: { teamspaceId: handover.teamspaceId },
      });
    } catch (error) {
      this.logger.error(
        `Teamspace ${handover.teamspaceId} owner changed but the notification failed`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async updateLastActiveWorkspaceAfterLeave(
    userId: string,
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<void> {
    const lastActiveWorkspaceId =
      await this.userProfilePreferenceService.getLastActiveWorkspace(
        userId,
        context,
      );

    if (lastActiveWorkspaceId !== workspaceId) {
      return;
    }

    const activeWorkspaces = await this.workspaceRepository.findByUserId(
      userId,
      context,
    );
    const fallbackWorkspaceId = activeWorkspaces[0]?.getId() ?? null;

    await this.userProfilePreferenceService.updateLastActiveWorkspace(
      userId,
      fallbackWorkspaceId,
      context,
    );
  }
}
