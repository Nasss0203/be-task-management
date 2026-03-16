export class UserWorkspaceResponseDto {
  id: string;
  workspace_id: string;
  user_id: string;
  joinedAt: Date;
  lastOpenedAt?: Date;
}
