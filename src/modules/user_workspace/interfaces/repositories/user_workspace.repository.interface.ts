import { UserWorkspaceModel } from '../../domain/models/user_workspace.model';

export type SaveUserWorkspaceInput = Pick<
  UserWorkspaceModel,
  'user_id' | 'workspace_id'
> &
  Partial<Pick<UserWorkspaceModel, 'id' | 'joinedAt' | 'lastOpenedAt'>>;

export interface UserWorkspaceRepository {
  create(input: SaveUserWorkspaceInput): Promise<UserWorkspaceModel>;
}
