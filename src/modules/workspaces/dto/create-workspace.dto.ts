import { PlanTypeWorkspace } from '../domain/entities/workspace.entity';

export class CreateWorkspaceDto {
  name: string;
  planType: PlanTypeWorkspace;
  slug: string;
}
