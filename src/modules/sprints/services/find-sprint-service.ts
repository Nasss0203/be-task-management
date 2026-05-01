import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { SprintsModel } from '../domain/models/sprints.model';
import { type FindSprintRepository } from '../interfaces/repositories/find-sprint.repository.interface';
import { FindSprintService } from '../interfaces/services/find-sprint.service.interface';
import { SPRINT_TYPES } from '../interfaces/types';

@Injectable()
export class FindSprintServiceImpl implements FindSprintService {
  constructor(
    @Inject(SPRINT_TYPES.repositories.FindSprintRepository)
    private readonly findSprintRepository: FindSprintRepository,
  ) {}

  async findOneSprint(
    sprintId: string,
    manager?: EntityManager,
  ): Promise<SprintsModel | null> {
    const existed = await this.findSprintRepository.findOneSprint(
      sprintId,
      manager,
    );

    if (!existed) {
      return null;
    }

    return existed;
  }

  async findAllSprintByProject(
    workspaceId: string,
    projectId: string,
    manager?: EntityManager,
  ): Promise<SprintsModel[]> {
    return this.findSprintRepository.findAllSprintByProject(
      workspaceId,
      projectId,
      manager,
    );
  }
}
