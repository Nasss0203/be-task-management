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
import { type StartSprintRepository } from '../interfaces/repositories/start-sprint.repository.interface';
import {
  StartSprintService,
  StartSprintServiceInput,
} from '../interfaces/services/start-sprint.service.interface';
import { SPRINT_TYPES } from '../interfaces/types';

@Injectable()
export class StartSprintServiceImpl implements StartSprintService {
  constructor(
    @Inject(SPRINT_TYPES.repositories.StartSprintRepository)
    private readonly startSprintRepository: StartSprintRepository,

    @Inject(SPRINT_TYPES.repositories.FindSprintRepository)
    private readonly findSprintRepository: FindSprintRepository,
  ) {}
  async startSprint(
    input: StartSprintServiceInput,
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

    if (sprint.status !== SprintStatus.PLANNED) {
      throw new BadRequestException('Only planned sprint can be started');
    }

    const name = input.name !== undefined ? input.name.trim() : undefined;

    if (name !== undefined && name === '') {
      throw new BadRequestException('Sprint name cannot be empty');
    }

    const goal =
      input.goal === undefined ? undefined : input.goal?.trim() || null;

    const startAt =
      input.startAt !== undefined && input.startAt !== null
        ? new Date(input.startAt)
        : (sprint.startAt ?? new Date());

    const endAt =
      input.endAt === undefined
        ? (sprint.endAt ?? null)
        : input.endAt === null
          ? null
          : new Date(input.endAt);

    if (Number.isNaN(startAt.getTime())) {
      throw new BadRequestException('Invalid startAt');
    }

    if (endAt && Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Invalid endAt');
    }

    if (endAt && startAt >= endAt) {
      throw new BadRequestException('Sprint startAt must be before endAt');
    }

    const startedSprint = await this.startSprintRepository.startSprint(
      {
        sprintId: input.sprintId,
        startAt,
        endAt,
        name: input.name?.trim(),
        goal: input.goal !== undefined ? input.goal.trim() || null : undefined,
      },
      manager,
    );

    if (!startedSprint) {
      throw new NotFoundException('Sprint not found');
    }

    return startedSprint;
  }
}
