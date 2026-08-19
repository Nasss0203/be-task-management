import { Workspace } from 'src/modules/workspace/domain/aggregates/workspace/workspace.aggregate';
import { WorkspaceLayoutMode } from 'src/modules/workspace/domain/enums/workspace-layout-mode.enum';
import { PlanTypeWorkspace } from 'src/modules/workspace/domain/enums/workspace-plan-type.enum';

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

  static fromDomain(workspace: Workspace): WorkspaceResponseDto {
    return {
      id: workspace.getId(),
      name: workspace.getName(),
      slug: workspace.getSlug(),
      planType: workspace.getPlanType(),
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
