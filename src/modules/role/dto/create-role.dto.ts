import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import { RoleName } from '../domain/entities/role.entity';

export class CreateRoleDto {
  name: RoleName;

  workspace_id: string;

  workspace: Workspace | null;

  created_at: Date;
}
