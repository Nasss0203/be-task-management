import { PlanTypeWorkspace } from '../../domain/entities/workspace.entity';

export class WorkspaceResponseDto {
  id: string;

  name: string;

  slug: string;

  planType: PlanTypeWorkspace;

  createdAt: Date;

  updatedAt: Date;
}
