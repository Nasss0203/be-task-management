import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { type MoveTasksToBacklogBySprintService } from 'src/modules/tasks/interfaces/services/move-tasks-to-backlog-by-sprint.service.interface';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';

import { SprintStatus } from '../domain/entities/sprint.entity';
import { SprintsModel } from '../domain/models/sprints.model';
import { type CancelSprintRepository } from '../interfaces/repositories/cancel-sprint.repository.interface';
import { type FindSprintRepository } from '../interfaces/repositories/find-sprint.repository.interface';
import {
  CancelSprintService,
  CancelSprintServiceInput,
} from '../interfaces/services/cancel-sprint.service.interface';
import { SPRINT_TYPES } from '../interfaces/types';

@Injectable()
export class CancelSprintServiceImpl implements CancelSprintService {
  constructor(
    @Inject(SPRINT_TYPES.repositories.CancelSprintRepository)
    private readonly cancelSprintRepository: CancelSprintRepository,

    @Inject(SPRINT_TYPES.repositories.FindSprintRepository)
    private readonly findSprintRepository: FindSprintRepository,

    @Inject(TASK_TYPES.services.MoveTasksToBacklogBySprintService)
    private readonly moveTasksToBacklogBySprintService: MoveTasksToBacklogBySprintService,
  ) {}

  async cancelSprint(
    input: CancelSprintServiceInput,
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

    if (sprint.status === SprintStatus.COMPLETED) {
      throw new BadRequestException('Completed sprint cannot be cancelled');
    }

    if (sprint.status === SprintStatus.CANCELLED) {
      throw new BadRequestException('Sprint already cancelled');
    }

    await this.moveTasksToBacklogBySprintService.move(
      {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        sprintId: input.sprintId,
      },
      manager,
    );

    const cancelledSprint = await this.cancelSprintRepository.cancelSprint(
      input.sprintId,
      manager,
    );

    if (!cancelledSprint) {
      throw new NotFoundException('Sprint not found');
    }

    return cancelledSprint;
  }
}
