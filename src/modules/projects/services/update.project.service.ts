import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectModel } from '../domain/models/projects.model';
import { UpdateProjectDto } from '../dto/update-project.dto';
import type { UpdateProjectRepository } from '../interfaces/repositories/update.project.repository.interface';
import type { FindProjectRepository } from '../interfaces/repositories/find.project.repository.interface';
import type { UpdateProjectService } from '../interfaces/services/update.project.service.interface';
import { PROJECT_TYPES } from '../interfaces/types';

@Injectable()
export class UpdateProjectServiceImpl implements UpdateProjectService {
  constructor(
    @Inject(PROJECT_TYPES.repositories.UpdateProjectRepository)
    private readonly updateRepository: UpdateProjectRepository,
    @Inject(PROJECT_TYPES.repositories.FindProjectRepository)
    private readonly findRepository: FindProjectRepository,
  ) {}

  async execute(
    projectId: string,
    workspaceId: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectModel> {
    const existingProject = await this.findRepository.findOneProjectById(projectId);
    if (!existingProject || existingProject.workspace_id !== workspaceId) {
      throw new NotFoundException('Project not found');
    }

    await this.updateRepository.update(projectId, workspaceId, updateProjectDto);

    const updatedProject = await this.findRepository.findOneProjectById(projectId);
    if (!updatedProject) {
      throw new NotFoundException('Project not found after update');
    }

    return updatedProject;
  }
}
