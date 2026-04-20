import { PlanTypeWorkspace } from '../../domain/entities/workspace.entity';

export class WorkspaceResponseDto {
  id: string;

  name: string;

  slug: string;

  planType: PlanTypeWorkspace;

  createdAt: Date;

  updatedAt: Date;
}

export type WorkspaceAccessResponseDto = {
  user_id: string;
  workspace_id: string;
  roles: string[];
  permissions: string[];
};
