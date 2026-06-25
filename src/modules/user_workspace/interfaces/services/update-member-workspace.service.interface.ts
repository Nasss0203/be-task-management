import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { EntityManager } from 'typeorm';
import { MemberWorkspaceModel } from '../../domain/models/user_workspace.model';

export interface UpdateMemberWorkspaceInput {
  workspace_id: string;
  user_id: string;
  role_name: RoleName;
  actor_id: string;
}

export interface UpdateMemberWorkspaceService {
  updateRole(
    input: UpdateMemberWorkspaceInput,
    manager?: EntityManager,
  ): Promise<void>;
}
