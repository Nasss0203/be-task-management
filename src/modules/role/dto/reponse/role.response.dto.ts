import { RoleName } from '../../domain/entities/role.entity';

export class RoleResponseDto {
  id: string;

  name: RoleName;

  workspace_id: string;

  created_at: Date;
  updated_at: Date;
}
