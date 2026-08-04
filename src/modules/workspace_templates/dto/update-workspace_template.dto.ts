import { PartialType } from '@nestjs/swagger';
import { CreateWorkspaceTemplateDto } from './create-workspace_template.dto';

export class UpdateWorkspaceTemplateDto extends PartialType(
  CreateWorkspaceTemplateDto,
) {}
