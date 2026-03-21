export class UserRoleResponseDto {
  user_id: string;

  workspace_id: string;

  role_id: string;

  assigned_at: Date;

  assigned_by: string;

  revoked_at?: Date | null;
}
