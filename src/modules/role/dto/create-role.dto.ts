import { RoleName } from '../domain/entities/role.entity';

export class CreateRoleDto {
  name: RoleName;

  workspace_id: string;

  created_at: Date;
}
