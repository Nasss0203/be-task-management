export class AdminWorkspaceTeamspaceItemResponseDto {
  id: string;
  workspaceId: string;
  name: string;
  visibility: 'OPEN' | 'CLOSED' | 'PRIVATE';
  createdBy: string | null;
  memberCount: number;
  pageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class AdminWorkspaceTeamspaceListResponseDto {
  items: AdminWorkspaceTeamspaceItemResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
