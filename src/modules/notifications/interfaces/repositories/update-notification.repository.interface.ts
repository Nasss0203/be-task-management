import { EntityManager } from 'typeorm';
import { WorkspaceInviteStatus } from 'src/modules/workspace_invites/domain/entities/workspace_invite.entity';

export type UpdateInviteNotificationStatusRepositoryInput = {
  inviteId: string;
  inviteStatus: WorkspaceInviteStatus;
};

export interface UpdateNotificationRepository {
  updateInviteNotificationStatus(
    input: UpdateInviteNotificationStatusRepositoryInput,
    manager?: EntityManager,
  ): Promise<number>;
}
