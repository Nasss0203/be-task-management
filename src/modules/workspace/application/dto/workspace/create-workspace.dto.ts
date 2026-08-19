import { PlanTypeWorkspace } from 'src/modules/workspace/domain/enums/workspace-plan-type.enum';

export class CreateWorkspaceDto {
  name: string;
  planType: PlanTypeWorkspace;
  slug: string;
}
