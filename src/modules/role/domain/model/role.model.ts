import { RoleName } from '../entities/role.entity';

export class RoleModel {
  constructor(
    public readonly id: string,
    public readonly name: RoleName,
    public readonly workspace_id: string,
    public readonly created_at: Date,
    public readonly updated_at: Date,
  ) {}
}
