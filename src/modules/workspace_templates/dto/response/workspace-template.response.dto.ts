export class WorkspaceTemplateResponseDto {
  id: string;
  name: string;
  description?: string;
  category?: string;
  visibility: string;
  isSystem: boolean;
  status: string;
  previewImageUrl?: string;
  createdBy?: string;
  workspaceId?: string;
  accessScope: 'SYSTEM' | 'PUBLIC' | 'PRIVATE_OWNER' | 'WORKSPACE';
  createdAt: Date;
  updatedAt: Date;

  // Optionally include stats if needed later
  // useCount: number;
  // likesCount: number;
}

export type PaginatedWorkspaceTemplateResponseDto = {
  data: WorkspaceTemplateResponseDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
