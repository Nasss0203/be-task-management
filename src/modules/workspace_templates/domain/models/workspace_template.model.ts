import { TemplateStatus, TemplateVisibility } from 'src/common/enum/template.enum';
import type { WorkspaceTemplateConfig } from 'src/modules/workspaces/types/types';

export class WorkspaceTemplateModel {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  coverUrl: string | null;
  config: WorkspaceTemplateConfig;
  isSystem: boolean;
  pageTemplateId: string | null;
  status: TemplateStatus;
  visibility: TemplateVisibility;
  createdBy: string | null;
  workspaceId: string | null;
  useCount: number;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type PaginatedWorkspaceTemplateModels = {
  data: WorkspaceTemplateModel[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
