import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { WorkspaceTemplate } from '../domain/entities/workspace_template.entity';
import type { WorkspaceTemplatesRepository } from '../interfaces/repositories/workspace_templates.repository.interface';
import type { WorkspaceTemplatesService } from '../interfaces/services/workspace_templates.service.interface';
import { WORKSPACE_TEMPLATE_TYPES } from '../interfaces/types';
import { FindWorkspaceTemplatesDto } from '../dto/find-workspace-templates.dto';
import { PaginatedWorkspaceTemplateResponseDto, WorkspaceTemplateResponseDto } from '../dto/response/workspace-template.response.dto';
import { TemplateVisibility } from 'src/common/enum/template.enum';
import { WorkspaceTemplateModel } from '../domain/models/workspace_template.model';
import { FindOptionsWhere } from 'typeorm';

@Injectable()
export class WorkspaceTemplatesServiceImpl implements WorkspaceTemplatesService {
  constructor(
    @Inject(WORKSPACE_TEMPLATE_TYPES.repositories.WorkspaceTemplatesRepository)
    private readonly workspaceTemplateRepo: WorkspaceTemplatesRepository,
  ) {}

  async findAll(where?: FindOptionsWhere<WorkspaceTemplateModel>): Promise<WorkspaceTemplateModel[]> {
    return this.workspaceTemplateRepo.findAll(where);
  }

  async findOne(id: string): Promise<WorkspaceTemplateModel> {
    const template = await this.workspaceTemplateRepo.findOne(id);
    if (!template) {
      throw new NotFoundException(`Workspace Template with ID ${id} not found`);
    }
    return template;
  }

  async findOneAvailableForUser(id: string, userId: string): Promise<WorkspaceTemplateModel> {
    const template = await this.workspaceTemplateRepo.findOneAvailableForUser(id, userId);
    if (!template) {
      throw new NotFoundException(`Workspace Template with ID ${id} not found or access denied`);
    }
    return template;
  }

  async findAllAvailableForUser(
    userId?: string,
    filters?: FindWorkspaceTemplatesDto,
  ): Promise<PaginatedWorkspaceTemplateResponseDto> {
    const result = await this.workspaceTemplateRepo.findAllAvailableForUser(userId, filters);

    const mappedData: WorkspaceTemplateResponseDto[] = result.data.map((template) => {
      let accessScope: WorkspaceTemplateResponseDto['accessScope'] = 'PUBLIC';

      if (template.isSystem) {
        accessScope = 'SYSTEM';
      } else if (template.visibility === TemplateVisibility.PRIVATE) {
        accessScope = 'PRIVATE_OWNER';
      } else if (template.visibility === TemplateVisibility.WORKSPACE) {
        accessScope = 'WORKSPACE';
      }

      return {
        id: template.id,
        name: template.name,
        description: template.description || undefined,
        category: template.category || undefined,
        visibility: template.visibility,
        isSystem: template.isSystem,
        status: template.status,
        previewImageUrl: template.coverUrl || undefined,
        createdBy: template.createdBy || undefined,
        workspaceId: template.workspaceId || undefined,
        accessScope,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      };
    });

    return {
      data: mappedData,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }

  async update(id: string, userId: string, data: any): Promise<void> {
    const template = await this.findOne(id);
    if (template.isSystem) {
      throw new ForbiddenException('Cannot modify system templates');
    }
    if (template.createdBy !== userId) {
      throw new ForbiddenException('You can only modify your own templates');
    }

    await this.workspaceTemplateRepo.update(id, data);
  }

  async delete(id: string, userId: string): Promise<void> {
    const template = await this.findOne(id);
    if (template.isSystem) {
      throw new ForbiddenException('Cannot delete system templates');
    }
    if (template.createdBy !== userId) {
      throw new ForbiddenException('You can only delete your own templates');
    }

    await this.workspaceTemplateRepo.delete(id);
  }
}
