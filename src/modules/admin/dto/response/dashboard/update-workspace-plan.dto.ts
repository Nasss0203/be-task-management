import { IsEnum } from 'class-validator';
import { PlanTypeWorkspace } from 'src/modules/workspaces/domain/entities/workspace.entity';

export class UpdateWorkspacePlanDto {
  @IsEnum(PlanTypeWorkspace)
  planType: PlanTypeWorkspace;
}
