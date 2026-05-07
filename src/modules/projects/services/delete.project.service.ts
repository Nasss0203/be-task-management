import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { type DeleteProjectRepository } from '../interfaces/repositories/delete-project.repository.interface';
import { DeleteProjectService } from '../interfaces/services/delete-project.service.interface';
import { PROJECT_TYPES } from '../interfaces/types';

@Injectable()
export class DeleteProjectServiceImpl implements DeleteProjectService {
  constructor(
    @Inject(PROJECT_TYPES.repositories.DeleteProjectRepository)
    private readonly deleteProjectRepository: DeleteProjectRepository,
  ) {}

  softDeleteProject(
    input: {
      projectId: string;
      deletedBy: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    return this.deleteProjectRepository.softDeleteProject(input, manager);
  }

  restoreProject(
    input: {
      projectId: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    return this.deleteProjectRepository.restoreProject(input, manager);
  }
}
