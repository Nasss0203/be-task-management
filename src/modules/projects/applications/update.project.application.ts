import { Inject, Injectable } from '@nestjs/common';
import { ProjectModel } from '../domain/models/projects.model';
import { UpdateProjectDto } from '../dto/update-project.dto';
import type { UpdateProjectApplication } from '../interfaces/applications/update.project.application.interface';
import type { UpdateProjectService } from '../interfaces/services/update.project.service.interface';
import { PROJECT_TYPES } from '../interfaces/types';

@Injectable()
export class UpdateProjectApplicationImpl implements UpdateProjectApplication {
  constructor(
    @Inject(PROJECT_TYPES.services.UpdateProjectService)
    private readonly updateProjectService: UpdateProjectService,
  ) {}

  async execute(
    projectId: string,
    workspaceId: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectModel> {
    return this.updateProjectService.execute(
      projectId,
      workspaceId,
      updateProjectDto,
    );
  }
}
