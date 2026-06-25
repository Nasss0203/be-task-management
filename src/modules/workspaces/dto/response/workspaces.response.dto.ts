import {
  PlanTypeWorkspace,
  WorkspaceLayoutMode,
} from '../../domain/entities/workspace.entity';

export class WorkspaceResponseDto {
  id: string;

  name: string;

  slug: string;

  planType: PlanTypeWorkspace;

  layoutMode: WorkspaceLayoutMode;

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;

  deletedBy: string | null;

  createdBy: string | null;
}

export type WorkspaceAccessResponseDto = {
  user_id: string;
  workspace_id: string;
  roles: string[];
  permissions: string[];
};
