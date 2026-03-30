import { PlanTypeWorkspace } from '../domain/entities/workspace.entity';

export class CreateWorkspaceMultiServiceDto {
  name: string;
  planType: PlanTypeWorkspace;
  slug: string;
}
