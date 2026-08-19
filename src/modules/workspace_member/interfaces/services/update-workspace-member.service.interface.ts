import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';
import { EntityManager } from 'typeorm';

export interface UpdateWorkspaceMemberInput {
  workspace_id: string;
  user_id: string;
  role_name: WorkspaceRole;
  actor_id: string;
}

export interface UpdateWorkspaceMemberService {
  updateRole(
    input: UpdateWorkspaceMemberInput,
    manager?: EntityManager,
  ): Promise<void>;
}
