import { Inject, Injectable } from '@nestjs/common';
import { WorkspaceResponseDto } from '../dto/response/workspaces.response.dto';
import {
  CreateWorkspaceTemplateApplication,
  CreateWorkspaceTemplateDto,
} from '../interfaces/applications/create-workspace-template.application.interface';
import { type CreateWorkspaceTemplateService } from '../interfaces/services/create-workspace-template.service.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';
import { WorkspaceMapper } from '../mapper/workspace.mapper';
import { WorkspaceTemplateType } from '../types/types';

@Injectable()
export class CreateWorkspaceTemplateApplicationImpl implements CreateWorkspaceTemplateApplication {
  constructor(
    @Inject(WORKSPACE_TYPES.services.CreateWorkspaceTemplateService)
    private readonly service: CreateWorkspaceTemplateService,
  ) {}

  async create({
    userId,
    createWorkspaceDto,
  }: {
    userId: string;
    createWorkspaceDto: CreateWorkspaceTemplateDto;
  }): Promise<WorkspaceResponseDto> {
    const model = await this.service.create(userId, {
      name: createWorkspaceDto.name,
      planType: createWorkspaceDto.planType,
      template:
        createWorkspaceDto.template ?? WorkspaceTemplateType.TASK_TRACKER,
    });

    return WorkspaceMapper.toResponse(model);
  }
}
