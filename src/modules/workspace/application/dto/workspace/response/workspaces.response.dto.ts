import { Workspace } from 'src/modules/workspace/domain/aggregates/workspace/workspace.aggregate';
import { WorkspaceLayoutMode } from 'src/modules/workspace/domain/enums/workspace-layout-mode.enum';

export class WorkspaceResponseDto {
  id: string;

  name: string;

  slug: string;

  layoutMode: WorkspaceLayoutMode;

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;

  deletedBy: string | null;

  createdBy: string | null;

  static fromDomain(workspace: Workspace): WorkspaceResponseDto {
    return {
      id: workspace.getId(),
      name: workspace.getName(),
      slug: workspace.getSlug(),
      layoutMode: workspace.getLayoutMode(),
      createdAt: workspace.getCreatedAt(),
      updatedAt: workspace.getUpdatedAt(),
      deletedAt: workspace.getDeletedAt(),
      deletedBy: workspace.getDeletedBy(),
      createdBy: workspace.getCreatedBy(),
    };
  }
}

export type WorkspaceAccessResponseDto = {
  user_id: string;
  workspace_id: string;
  roles: string[];
  permissions: string[];
};
