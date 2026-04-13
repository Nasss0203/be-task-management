import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { EntityManager } from 'typeorm';
import { WorkspaceInviteModel } from '../../domain/models/workspace_invite.model';

export type CreateWorkspaceInviteInput = {
  workspace_id: string;
  user_id?: string | null;
  email: string;
  role_name: RoleName;
  invited_by: string;
};

export interface CreateWorkspaceInviteService {
  save(
    input: CreateWorkspaceInviteInput,
    manager?: EntityManager,
  ): Promise<WorkspaceInviteModel>;
}
