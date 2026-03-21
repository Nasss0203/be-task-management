import { Inject, Injectable } from '@nestjs/common';

import { ProjectModel } from '../domain/models/projects.model';
import { type FindProjectRepository } from '../interfaces/repositories/find.project.repository.interface';
import { FindProjectService } from '../interfaces/services/find.project.service.interface';
import { PROJECT_TYPES } from '../interfaces/types';

@Injectable()
export class FindProjectServiceImpl implements FindProjectService {
  constructor(
    @Inject(PROJECT_TYPES.repositories.FindProjectRepository)
    private readonly findProjectRepository: FindProjectRepository,
  ) {}

  async findAllByWorkspaceId(workspaceId: string): Promise<ProjectModel[]> {
    return this.findProjectRepository.findAllByWorkspaceId(workspaceId);
  }
  s;
}
