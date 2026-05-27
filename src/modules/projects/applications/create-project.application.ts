import { Inject, Injectable } from '@nestjs/common';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { CreateProjectDto } from '../dto/create-project.dto';
import { ProjectResponseDto } from '../dto/reponse/project.response.dto';
import { CreateProjectApplication } from '../interfaces/applications/create-project.application.interface';
import { type CreateProjectService } from '../interfaces/services/create.project.service.interface';
import { PROJECT_TYPES } from '../interfaces/types';
import { ProjectMapper } from '../mapper/projects.mapper';

@Injectable()
export class CreateProjectApplicationImpl implements CreateProjectApplication {
  constructor(
    @Inject(PROJECT_TYPES.services.CreateProjectService)
    private readonly service: CreateProjectService,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    const model = await this.service.create(createProjectDto);

    await this.createActivityService.create({
      workspaceId: model.workspace_id,
      projectId: model.id,
      entityType: ActivityEntityType.PROJECT,
      entityId: model.id,
      actorId: createProjectDto.created_by,
      action: ActivityAction.PROJECT_CREATED,
      metadata: {
        name: model.name,
        key: model.key,
        visibility: model.visibility,
      },
    });

    return ProjectMapper.toResponse(model);
  }

  async createProjectWithPageBlock(
    createProjectDto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    const model =
      await this.service.createProjectWithPageBlock(createProjectDto);

    await this.createActivityService.create({
      workspaceId: model.workspace_id,
      projectId: model.id,
      entityType: ActivityEntityType.PROJECT,
      entityId: model.id,
      actorId: createProjectDto.created_by,
      action: ActivityAction.PROJECT_CREATED,
      metadata: {
        name: model.name,
        key: model.key,
        visibility: model.visibility,
      },
    });

    return ProjectMapper.toResponse(model);
  }
}
