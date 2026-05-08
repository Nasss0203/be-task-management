import { Inject, Injectable } from '@nestjs/common';
import { ProjectResponseDto } from '../dto/reponse/project.response.dto';
import { FindProjectApplication } from '../interfaces/applications/find.project.application.interface';
import { FindProjectFilter } from '../interfaces/find-project-filter.type';
import { type FindProjectService } from '../interfaces/services/find.project.service.interface';
import { PROJECT_TYPES } from '../interfaces/types';
import { ProjectMapper } from '../mapper/projects.mapper';

@Injectable()
export class FindProjectApplicationImpl implements FindProjectApplication {
  constructor(
    @Inject(PROJECT_TYPES.services.FindProjectService)
    private readonly service: FindProjectService,
  ) {}

  async findDeletedProjects(
    workspaceId: string,
  ): Promise<ProjectResponseDto[]> {
    const projects = await this.service.findDeletedProjects(workspaceId);

    return projects.map((project) => ProjectMapper.toResponse(project));
  }

  async findAllByWorkspaceId(
    workspaceId: string,
    filter?: FindProjectFilter,
  ): Promise<ProjectResponseDto[]> {
    const projects = await this.service.findAllByWorkspaceId(
      workspaceId,
      filter,
    );
    return projects.map((project) => ProjectMapper.toResponse(project));
  }
}
