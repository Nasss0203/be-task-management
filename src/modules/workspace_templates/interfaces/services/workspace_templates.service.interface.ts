import { WorkspaceTemplate } from '../../domain/entities/workspace_template.entity';
import { FindOptionsWhere } from 'typeorm';

import { FindWorkspaceTemplatesDto } from '../../dto/find-workspace-templates.dto';
import { PaginatedWorkspaceTemplateResponseDto, WorkspaceTemplateResponseDto } from '../../dto/response/workspace-template.response.dto';
import { WorkspaceTemplateModel } from '../../domain/models/workspace_template.model';

export interface WorkspaceTemplatesService {
  findAll(where?: FindOptionsWhere<WorkspaceTemplateModel>): Promise<WorkspaceTemplateModel[]>;
  findAllAvailableForUser(
    userId?: string,
    filters?: FindWorkspaceTemplatesDto,
  ): Promise<PaginatedWorkspaceTemplateResponseDto>;
  findOneAvailableForUser(id: string, userId: string): Promise<WorkspaceTemplateModel>;
  findOne(id: string): Promise<WorkspaceTemplateModel>;
  update(id: string, userId: string, data: any): Promise<void>;
  delete(id: string, userId: string): Promise<void>;
}
