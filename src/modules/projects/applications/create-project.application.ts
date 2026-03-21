import { Inject, Injectable } from '@nestjs/common';
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
  ) {}
  async create(
    createProjectDto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    const model = await this.service.create(createProjectDto);

    return ProjectMapper.toResponse(model);
  }
}
