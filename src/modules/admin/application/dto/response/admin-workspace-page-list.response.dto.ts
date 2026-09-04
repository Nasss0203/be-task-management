export class AdminWorkspacePageItemResponseDto {
  id: string;
  workspaceId: string;
  teamspaceId: string | null;
  parentPageId: string | null;
  title: string;
  slug: string | null;
  icon: string | null;
  coverUrl: string | null;
  isTemplate: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AdminWorkspacePageListResponseDto {
  items: AdminWorkspacePageItemResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
