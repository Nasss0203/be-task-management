import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';
import { EntityManager } from 'typeorm';
import { WorkspaceMemberModel } from '../../domain/models/workspace-member.model';

export type AddWorkspaceMemberInput = {
  workspace_id: string;
  user_id: string;
  role_name?: WorkspaceRole;
  added_by: string;
};

export interface AddWorkspaceMemberService {
  addMember(
    input: AddWorkspaceMemberInput,
    manager?: EntityManager,
  ): Promise<WorkspaceMemberModel>;
}
