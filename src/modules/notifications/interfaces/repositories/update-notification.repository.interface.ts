import { EntityManager } from 'typeorm';
import { WorkspaceInviteStatus } from 'src/modules/workspace/domain/enums/workspace-invite-status.enum';

export type UpdateInviteNotificationStatusRepositoryInput = {
  inviteId: string;
  inviteStatus: WorkspaceInviteStatus;
};

export interface UpdateNotificationRepository {
  updateInviteNotificationStatus(
    input: UpdateInviteNotificationStatusRepositoryInput,
    manager?: EntityManager,
  ): Promise<number>;

  markAllAsRead(receiverId: string, manager?: EntityManager): Promise<number>;

  markAsRead(
    notificationId: string,
    receiverId: string,
    manager?: EntityManager,
  ): Promise<number>;
}
