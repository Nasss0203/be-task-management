// src/modules/sprints/services/update-sprint.service.ts

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { SprintStatus } from '../domain/entities/sprint.entity';
import { SprintsModel } from '../domain/models/sprints.model';
import { type FindSprintRepository } from '../interfaces/repositories/find-sprint.repository.interface';

import { type UpdateSprintRepository } from '../interfaces/repositories/udpdate-sprint.repository.interface';
import {
  UpdateSprintService,
  UpdateSprintServiceInput,
} from '../interfaces/services/udpdate-sprint.service.interface';
import { SPRINT_TYPES } from '../interfaces/types';

@Injectable()
export class UpdateSprintServiceImpl implements UpdateSprintService {
  constructor(
    @Inject(SPRINT_TYPES.repositories.FindSprintRepository)
    private readonly findSprintRepository: FindSprintRepository,

    @Inject(SPRINT_TYPES.repositories.UpdateSprintRepository)
    private readonly updateSprintRepository: UpdateSprintRepository,
  ) {}

  async updateSprint(
    input: UpdateSprintServiceInput,
    manager?: EntityManager,
  ): Promise<SprintsModel> {
    const sprint = await this.findSprintRepository.findOneSprint(
      input.id,
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

    if (sprint.status === SprintStatus.COMPLETED) {
      throw new BadRequestException('Completed sprint cannot be updated');
    }

    if (sprint.status === SprintStatus.CANCELLED) {
      throw new BadRequestException('Cancelled sprint cannot be updated');
    }

    if (input.name !== undefined && input.name.trim() === '') {
      throw new BadRequestException('Sprint name cannot be empty');
    }

    if (sprint.status === SprintStatus.ACTIVE) {
      const isUpdatingLockedField =
        input.name !== undefined || input.startAt !== undefined;

      if (isUpdatingLockedField) {
        throw new BadRequestException(
          'Active sprint can only update goal or endAt',
        );
      }
    }

    const nextStartAt =
      input.startAt !== undefined ? input.startAt : sprint.startAt;

    const nextEndAt = input.endAt !== undefined ? input.endAt : sprint.endAt;

    if (nextStartAt && nextEndAt && nextStartAt > nextEndAt) {
      throw new BadRequestException('Sprint startAt must be before endAt');
    }

    const updatedSprint = await this.updateSprintRepository.updateSprint(
      input,
      manager,
    );

    if (!updatedSprint) {
      throw new NotFoundException('Sprint not found');
    }

    return updatedSprint;
  }
}
