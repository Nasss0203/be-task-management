import { WorkspaceLayoutMode } from 'src/modules/workspace/domain/enums/workspace-layout-mode.enum';

export class AdminWorkspaceOwnerResponseDto {
  id: string;
  email: string;
  username: string;
}

export class AdminWorkspaceSummaryResponseDto {
  id: string;
  name: string;
  slug: string;
  layoutMode: WorkspaceLayoutMode;
  owner: AdminWorkspaceOwnerResponseDto | null;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class AdminWorkspaceListResponseDto {
  items: AdminWorkspaceSummaryResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
