import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { SprintsModel } from '../domain/models/sprints.model';
import { SprintProgressResponseDto } from '../dto/sprint-progress.response.dto';
import { FindSprintQuery } from '../interfaces/find-sprint-query.interface';
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
    query?: FindSprintQuery,
    manager?: EntityManager,
  ): Promise<SprintsModel[]> {
    return await this.findSprintRepository.findAllSprintByProject(
      workspaceId,
      projectId,
      query,
      manager,
    );
  }

  async findTasksBySprint(
    workspaceId: string,
    projectId: string,
    sprintId: string,
    manager?: EntityManager,
  ): Promise<SprintsModel | null> {
    return this.findSprintRepository.findTasksBySprint(
      workspaceId,
      projectId,
      sprintId,
      manager,
    );
  }

  async getSprintProgress(
    workspaceId: string,
    projectId: string,
    sprintId: string,
    manager?: EntityManager,
  ): Promise<SprintProgressResponseDto | null> {
    return this.findSprintRepository.getSprintProgress(
      workspaceId,
      projectId,
      sprintId,
      manager,
    );
  }
}
