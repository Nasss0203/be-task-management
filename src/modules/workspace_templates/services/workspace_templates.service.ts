import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { WorkspaceTemplate } from '../domain/entities/workspace_template.entity';
import type { WorkspaceTemplatesRepository } from '../interfaces/repositories/workspace_templates.repository.interface';
import type { WorkspaceTemplatesService } from '../interfaces/services/workspace_templates.service.interface';
import { WORKSPACE_TEMPLATE_TYPES } from '../interfaces/types';

@Injectable()
export class WorkspaceTemplatesServiceImpl implements WorkspaceTemplatesService {
  constructor(
    @Inject(WORKSPACE_TEMPLATE_TYPES.repositories.WorkspaceTemplatesRepository)
    private readonly workspaceTemplateRepo: WorkspaceTemplatesRepository,
  ) {}

  async findAll(where?: import('typeorm').FindOptionsWhere<WorkspaceTemplate>): Promise<WorkspaceTemplate[]> {
    return this.workspaceTemplateRepo.findAll(where);
  }

  async findOne(id: string): Promise<WorkspaceTemplate> {
    const template = await this.workspaceTemplateRepo.findOne(id);
    if (!template) {
      throw new NotFoundException(`Workspace Template with ID ${id} not found`);
    }
    return template;
  }
}
