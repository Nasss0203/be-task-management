import { EntityManager } from 'typeorm';
import { WorkspaceInviteStatus } from 'src/modules/workspace_invites/domain/entities/workspace_invite.entity';

export type UpdateInviteNotificationStatusServiceInput = {
  inviteId: string;
  inviteStatus: WorkspaceInviteStatus;
};

export interface UpdateNotificationService {
  updateInviteNotificationStatus(
    input: UpdateInviteNotificationStatusServiceInput,
    manager?: EntityManager,
  ): Promise<number>;

  markAllAsRead(userId: string, manager?: EntityManager): Promise<number>;

  markAsRead(
    notificationId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<number>;
}
