import { WorkspaceTemplate } from '../../domain/entities/workspace_template.entity';
import { FindOptionsWhere } from 'typeorm';
import { FindWorkspaceTemplatesDto } from '../../dto/find-workspace-templates.dto';
import { PaginatedWorkspaceTemplateModels, WorkspaceTemplateModel } from '../../domain/models/workspace_template.model';

export interface WorkspaceTemplatesRepository {
  findOne(id: string): Promise<WorkspaceTemplateModel | null>;
  findAll(where?: FindOptionsWhere<WorkspaceTemplate>): Promise<WorkspaceTemplateModel[]>;
  findAllAvailableForUser(
    userId?: string,
    filters?: FindWorkspaceTemplatesDto,
  ): Promise<PaginatedWorkspaceTemplateModels>;
  findOneAvailableForUser(id: string, userId: string): Promise<WorkspaceTemplateModel | null>;
  update(id: string, data: Partial<WorkspaceTemplate>): Promise<void>;
  delete(id: string): Promise<void>;
}
