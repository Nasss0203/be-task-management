import { EntityManager } from 'typeorm';
import { WorkspaceInviteModel } from '../../domain/models/workspace_invite.model';

export type SaveWorkspaceInviteInput = Pick<
  WorkspaceInviteModel,
  | 'workspace_id'
  | 'email'
  | 'type'
  | 'role_name'
  | 'invited_by'
  | 'token'
  | 'status'
  | 'expires_at'
> &
  Partial<
    Pick<
      WorkspaceInviteModel,
      | 'id'
      | 'user_id'
      | 'accepted_at'
      | 'max_uses'
      | 'used_count'
      | 'created_at'
      | 'updated_at'
    >
  >;

export interface CreateWorkspaceInviteRepository {
  save(
    input: SaveWorkspaceInviteInput,
    manager?: EntityManager,
  ): Promise<WorkspaceInviteModel>;
}
