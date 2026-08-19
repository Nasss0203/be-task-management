import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';
import { EntityManager } from 'typeorm';
import { WorkspaceInviteModel } from '../../domain/models/workspace_invite.model';

export type CreateWorkspaceInviteInput = {
  workspace_id: string;
  user_id?: string | null;
  email: string;
  role_name: WorkspaceRole;
  invited_by: string;
};

export interface CreateWorkspaceInviteService {
  save(
    input: CreateWorkspaceInviteInput,
    manager?: EntityManager,
  ): Promise<WorkspaceInviteModel>;
}
