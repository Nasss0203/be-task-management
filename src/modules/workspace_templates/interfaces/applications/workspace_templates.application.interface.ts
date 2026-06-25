import { FindWorkspaceTemplatesDto } from '../../dto/find-workspace-templates.dto';
import { PaginatedWorkspaceTemplateResponseDto } from '../../dto/response/workspace-template.response.dto';
import { WorkspaceTemplateModel } from '../../domain/models/workspace_template.model';
import { UpdateWorkspaceTemplateDto } from '../../dto/update-workspace-template.dto';

export interface WorkspaceTemplatesApplication {
  findAllAvailableForUser(
    userId?: string,
    filters?: FindWorkspaceTemplatesDto,
  ): Promise<PaginatedWorkspaceTemplateResponseDto>;
  findOneAvailableForUser(id: string, userId: string): Promise<WorkspaceTemplateModel>;
  update(id: string, userId: string, data: UpdateWorkspaceTemplateDto): Promise<void>;
  delete(id: string, userId: string): Promise<void>;
}
