export class CreateWorkspaceMemberDto {
  id?: string;
  workspace_id: string;
  user_id: string;
  role_id: string;
  joinedAt?: Date;
}
