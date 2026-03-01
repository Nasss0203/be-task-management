import { WorkspaceMemberModel } from '../../domain/models/workspace-member.model';

export type SaveWorkspaceMemberInput = Pick<
  WorkspaceMemberModel,
  'user_id' | 'role_id' | 'workspace_id'
> &
  Partial<Pick<WorkspaceMemberModel, 'id' | 'joinedAt'>>;

export interface WorkspaceMemberRepository {
  create(input: SaveWorkspaceMemberInput): Promise<WorkspaceMemberModel>;
}
