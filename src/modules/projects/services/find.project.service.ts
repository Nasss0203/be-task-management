import { Inject, Injectable } from '@nestjs/common';

import { EntityManager } from 'typeorm';
import { ProjectModel } from '../domain/models/projects.model';
import {
  ProjectRestoreLookup,
  type FindProjectRepository,
} from '../interfaces/repositories/find.project.repository.interface';
import { FindProjectService } from '../interfaces/services/find.project.service.interface';
import { PROJECT_TYPES } from '../interfaces/types';

@Injectable()
export class FindProjectServiceImpl implements FindProjectService {
  constructor(
    @Inject(PROJECT_TYPES.repositories.FindProjectRepository)
    private readonly findProjectRepository: FindProjectRepository,
  ) {}

  findDeletedProjects(workspaceId: string): Promise<ProjectModel[]> {
    return this.findProjectRepository.findDeletedProjects(workspaceId);
  }

  findOneProjectForRestore(
    workspaceId: string,
    projectId: string,
  ): Promise<ProjectRestoreLookup | null> {
    return this.findProjectRepository.findOneProjectForRestore(
      workspaceId,
      projectId,
    );
  }

  existsActiveProjectKey(
    workspaceId: string,
    key: string,
    excludeProjectId?: string,
  ): Promise<boolean> {
    return this.findProjectRepository.existsActiveProjectKey(
      workspaceId,
      key,
      excludeProjectId,
    );
  }

  async findAllByWorkspaceId(workspaceId: string): Promise<ProjectModel[]> {
    return this.findProjectRepository.findAllByWorkspaceId(workspaceId);
  }

  async findOneProjectById(
    projectId: string,
    manager?: EntityManager,
  ): Promise<ProjectModel | null> {
    return await this.findProjectRepository.findOneProjectById(
      projectId,
      manager,
    );
  }
}
