import { ACTIVITY_TYPES } from 'src/modules/activity/activity.types';
import { type CreateActivityService } from 'src/modules/activity/application/ports/create-activity.service.port';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import {
  BadRequestException,
  ConflictException,
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
import { TeamspaceMember } from 'src/modules/teamspace/domain/entities/teamspace-member.entity';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import type { TeamspaceMemberRepository } from 'src/modules/teamspace/domain/repositories/teamspace-member.repository';
import type { TeamspaceRepository } from 'src/modules/teamspace/domain/repositories/teamspace.repository';
import { TEAMSPACE_TYPES } from 'src/modules/teamspace/teamspace.types';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import type { TeamspaceMembershipLock } from '../../../ports/teamspace-membership-lock.port';
import { LeaveTeamspaceCommand } from './leave-teamspace.command';

export const TEAMSPACE_OWNER_TRANSFER_REQUIRED =
  'TEAMSPACE_OWNER_TRANSFER_REQUIRED';

interface OwnershipTransfer {
  receiverId: string;
  workspaceId: string;
  teamspaceId: string;
  teamspaceName: string;
}

@Injectable()
export class LeaveTeamspaceHandler {
  private readonly logger = new Logger(LeaveTeamspaceHandler.name);

  constructor(
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceRepository)
    private readonly teamspaceRepo: TeamspaceRepository,

    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceMemberRepository)
    private readonly memberRepo: TeamspaceMemberRepository,

    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepo: WorkspaceMemberRepository,

    @Inject(TEAMSPACE_TYPES.ports.TeamspaceMembershipLock)
    private readonly membershipLock: TeamspaceMembershipLock,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
    @Inject(NOTIFICATION_TYPES.services.CreateNotificationService)
    private readonly notifications: CreateNotificationService,
  ) {}

  async execute(command: LeaveTeamspaceCommand): Promise<void> {
    const transfer = await this.uow.runInTransaction(async (context) => {
      // Resolve the actor's WorkspaceMember ID before acquiring row locks.
      const initialTeamspace = await this.teamspaceRepo.findById(
        command.teamspaceId,
        context,
      );
      if (!initialTeamspace) {
        throw new NotFoundException('Teamspace not found');
      }

      const initialActor = await this.workspaceMemberRepo.findByWorkspaceAndUser(
        initialTeamspace.getWorkspaceId(),
        command.userId,
        context,
      );
      if (!initialActor) {
        throw new NotFoundException('Teamspace member not found');
      }

      const initialMember = await this.memberRepo.findByTeamspaceAndWorkspaceMember(
        command.teamspaceId,
        initialActor.getId(),
        context,
      );
      if (!initialMember) {
        throw new NotFoundException('Teamspace member not found');
      }

      await this.membershipLock.lockForMembershipChange(
        initialActor.getId(),
        command.teamspaceId,
        command.userId,
        context,
      );

      const teamspace = await this.teamspaceRepo.findById(
        command.teamspaceId,
        context,
      );
      if (!teamspace) {
        throw new NotFoundException('Teamspace not found');
      }

      const actor = await this.workspaceMemberRepo.findByWorkspaceAndUser(
        teamspace.getWorkspaceId(),
        command.userId,
        context,
      );
      if (
        !actor ||
        actor.getId() !== initialActor.getId() ||
        actor.getWorkspaceId() !== teamspace.getWorkspaceId()
      ) {
        throw new NotFoundException('Teamspace member not found');
      }

      const member = await this.memberRepo.findByTeamspaceAndWorkspaceMember(
        command.teamspaceId,
        actor.getId(),
        context,
      );
      if (
        !member ||
        member.getId() !== initialMember.getId() ||
        member.getTeamspaceId() !== command.teamspaceId ||
        member.getWorkspaceMemberId() !== actor.getId()
      ) {
        throw new NotFoundException('Teamspace member not found');
      }

      const members = await this.memberRepo.findByTeamspaceId(
        command.teamspaceId,
        context,
      );
      const others = members.filter((item) => item.getId() !== member.getId());
      const isLastOwner =
        member.getRoleName() === TeamspaceRole.OWNER &&
        !others.some((item) => item.getRoleName() === TeamspaceRole.OWNER);

      let newOwner: TeamspaceMember | null = null;
      if (isLastOwner && others.length > 0) {
        if (!command.newOwnerMemberId) {
          throw new ConflictException({
            code: TEAMSPACE_OWNER_TRANSFER_REQUIRED,
            message: 'Choose a new owner before leaving this teamspace',
          });
        }
        newOwner =
          others.find((item) => item.getId() === command.newOwnerMemberId) ??
          null;
        if (!newOwner) {
          throw new BadRequestException(
            'The new owner must be a member of this teamspace',
          );
        }
      }

      const deleted = await this.memberRepo.deleteById(member.getId(), context);
      if (!deleted) {
        throw new NotFoundException('Teamspace member not found');
      }
      await this.createActivityService.create(
        {
          workspaceId: teamspace.getWorkspaceId(),
          entityType: ActivityEntityType.TEAMSPACE,
          entityId: command.teamspaceId,
          actorId: command.userId,
          action: ActivityAction.TEAMSPACE_MEMBER_LEFT,
          metadata: { userId: command.userId },
        },
        context,
      );

      if (newOwner) {
        const previousRole = newOwner.getRoleName();
        newOwner.changeRole(TeamspaceRole.OWNER);
        await this.memberRepo.save(newOwner, context);
        await this.createActivityService.create(
          {
            workspaceId: teamspace.getWorkspaceId(),
            entityType: ActivityEntityType.TEAMSPACE,
            entityId: command.teamspaceId,
            actorId: command.userId,
            action: ActivityAction.TEAMSPACE_MEMBER_ROLE_CHANGED,
            metadata: {
              workspaceMemberId: newOwner.getWorkspaceMemberId(),
              from: previousRole,
              to: TeamspaceRole.OWNER,
            },
          },
          context,
        );
        const newOwnerWorkspaceMember = await this.workspaceMemberRepo.findById(
          newOwner.getWorkspaceMemberId(),
          context,
        );
        return newOwnerWorkspaceMember
          ? {
              receiverId: newOwnerWorkspaceMember.getUserId(),
              workspaceId: teamspace.getWorkspaceId(),
              teamspaceId: teamspace.getId(),
              teamspaceName: teamspace.getName(),
            }
          : null;
      }

      if (others.length === 0) {
        teamspace.markAsDeleted(command.userId);
        await this.teamspaceRepo.save(teamspace, context);
        await this.createActivityService.create(
          {
            workspaceId: teamspace.getWorkspaceId(),
            entityType: ActivityEntityType.TEAMSPACE,
            entityId: teamspace.getId(),
            actorId: command.userId,
            action: ActivityAction.TEAMSPACE_ARCHIVED,
          },
          context,
        );
      }

      return null;
    });

    if (transfer) {
      await this.notifyNewOwner(command.userId, transfer);
    }
  }

  private async notifyNewOwner(
    actorId: string,
    transfer: OwnershipTransfer,
  ): Promise<void> {
    try {
      await this.notifications.createNotification({
        receiverId: transfer.receiverId,
        senderType: NotificationSenderType.USER,
        actorId,
        sourceType: NotificationSourceType.TEAMSPACE,
        sourceId: transfer.teamspaceId,
        workspaceId: transfer.workspaceId,
        type: NotificationType.TEAMSPACE_OWNERSHIP_TRANSFERRED,
        title: 'Bạn là owner mới của Teamspace',
        message: `Bạn được chuyển quyền owner của Teamspace "${transfer.teamspaceName}".`,
        metadata: { teamspaceId: transfer.teamspaceId },
      });
    } catch (error) {
      this.logger.error(
        `Teamspace ${transfer.teamspaceId} owner changed but the notification failed`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
