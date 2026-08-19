import { EntityManager } from 'typeorm';
import { WorkspaceMemberModel } from '../../domain/models/workspace-member.model';

export type SaveWorkspaceMemberInput = Pick<
  WorkspaceMemberModel,
  'user_id' | 'workspace_id'
> &
  Partial<
    Pick<WorkspaceMemberModel, 'id' | 'role_name' | 'joinedAt' | 'lastOpenedAt'>
  >;

export interface WorkspaceMemberRepository {
  create(
    input: SaveWorkspaceMemberInput,
    manager?: EntityManager,
  ): Promise<WorkspaceMemberModel>;

  deleteByUserId(
    workspaceId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<void>;

  updateRole(
    workspaceId: string,
    userId: string,
    roleName: WorkspaceMemberModel['role_name'],
    manager?: EntityManager,
  ): Promise<void>;
}
