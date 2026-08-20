import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { WorkspaceInviteStatus } from 'src/modules/workspace/domain/enums/workspace-invite-status.enum';

export type UpdateInviteNotificationStatusServiceInput = {
  inviteId: string;
  inviteStatus: WorkspaceInviteStatus;
};

export interface UpdateNotificationService {
  updateInviteNotificationStatus(
    input: UpdateInviteNotificationStatusServiceInput,
    context?: PersistenceContext,
  ): Promise<number>;

  markAllAsRead(userId: string, context?: PersistenceContext): Promise<number>;

  markAsRead(
    notificationId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<number>;
}
