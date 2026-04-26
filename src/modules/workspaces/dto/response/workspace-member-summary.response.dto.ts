export class WorkspaceOwnerSummaryDto {
  id: string;
  username: string;
  email: string;
}

export class WorkspaceMemberSummaryResponseDto {
  workspaceId: string;
  owner: WorkspaceOwnerSummaryDto | null;
  memberCount: number;
  inviteCount: number;
}
