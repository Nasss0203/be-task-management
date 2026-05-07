// src/modules/sprints/services/get-sprint-detail.service.ts

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { SprintsModel } from '../domain/models/sprints.model';
import { type FindSprintRepository } from '../interfaces/repositories/find-sprint.repository.interface';
import {
  GetSprintDetailService,
  GetSprintDetailServiceInput,
} from '../interfaces/services/get-sprint-detail.service.interface';
import { SPRINT_TYPES } from '../interfaces/types';

@Injectable()
export class GetSprintDetailServiceImpl implements GetSprintDetailService {
  constructor(
    @Inject(SPRINT_TYPES.repositories.FindSprintRepository)
    private readonly findSprintRepository: FindSprintRepository,
  ) {}

  async getSprintDetail(
    input: GetSprintDetailServiceInput,
    manager?: EntityManager,
  ): Promise<SprintsModel> {
    const sprint = await this.findSprintRepository.findOneSprint(
      input.sprintId,
      manager,
    );

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    if (sprint.workspaceId !== input.workspaceId) {
      throw new BadRequestException('Sprint does not belong to this workspace');
    }

    if (sprint.projectId !== input.projectId) {
      throw new BadRequestException('Sprint does not belong to this project');
    }

    return sprint;
  }
}
