import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { WorkspaceInviteStatus } from 'src/modules/workspace/domain/enums/workspace-invite-status.enum';

export type UpdateInviteNotificationStatusRepositoryInput = {
  inviteId: string;
  inviteStatus: WorkspaceInviteStatus;
};

export interface UpdateNotificationRepository {
  updateInviteNotificationStatus(
    input: UpdateInviteNotificationStatusRepositoryInput,
    context?: PersistenceContext,
  ): Promise<number>;

  markAllAsRead(
    receiverId: string,
    context?: PersistenceContext,
  ): Promise<number>;

  markAsRead(
    notificationId: string,
    receiverId: string,
    context?: PersistenceContext,
  ): Promise<number>;
}
