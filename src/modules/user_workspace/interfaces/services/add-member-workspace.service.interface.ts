import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { EntityManager } from 'typeorm';
import { UserWorkspaceModel } from '../../domain/models/user_workspace.model';

export type AddMemberWorkspaceInput = {
  workspace_id: string;
  user_id: string;
  role_name?: RoleName;
  added_by: string;
};

export interface AddMemberWorkspaceService {
  addMember(
    input: AddMemberWorkspaceInput,
    manager?: EntityManager,
  ): Promise<UserWorkspaceModel>;
}
