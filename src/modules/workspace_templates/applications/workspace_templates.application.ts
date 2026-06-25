import { Inject, Injectable } from '@nestjs/common';
import { WorkspaceTemplateModel } from '../domain/models/workspace_template.model';
import { FindWorkspaceTemplatesDto } from '../dto/find-workspace-templates.dto';
import { PaginatedWorkspaceTemplateResponseDto } from '../dto/response/workspace-template.response.dto';
import { UpdateWorkspaceTemplateDto } from '../dto/update-workspace-template.dto';
import { WorkspaceTemplatesApplication } from '../interfaces/applications/workspace_templates.application.interface';
import { type WorkspaceTemplatesService } from '../interfaces/services/workspace_templates.service.interface';
import { WORKSPACE_TEMPLATE_TYPES } from '../interfaces/types';

@Injectable()
export class WorkspaceTemplatesApplicationImpl implements WorkspaceTemplatesApplication {
  constructor(
    @Inject(WORKSPACE_TEMPLATE_TYPES.services.WorkspaceTemplatesService)
    private readonly workspaceTemplatesService: WorkspaceTemplatesService,
  ) {}

  async findAllAvailableForUser(
    userId?: string,
    filters?: FindWorkspaceTemplatesDto,
  ): Promise<PaginatedWorkspaceTemplateResponseDto> {
    return this.workspaceTemplatesService.findAllAvailableForUser(
      userId,
      filters,
    );
  }

  async findOneAvailableForUser(
    id: string,
    userId: string,
  ): Promise<WorkspaceTemplateModel> {
    return this.workspaceTemplatesService.findOneAvailableForUser(id, userId);
  }

  async update(
    id: string,
    userId: string,
    data: UpdateWorkspaceTemplateDto,
  ): Promise<void> {
    return this.workspaceTemplatesService.update(id, userId, data);
  }

  async delete(id: string, userId: string): Promise<void> {
    return this.workspaceTemplatesService.delete(id, userId);
  }
}
