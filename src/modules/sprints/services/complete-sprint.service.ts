import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type MoveUnfinishedTasksToBacklogService } from 'src/modules/tasks/interfaces/services/move-unfinished-tasks-to-backlog.service.interface';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import { EntityManager } from 'typeorm';
import { SprintStatus } from '../domain/entities/sprint.entity';
import { SprintsModel } from '../domain/models/sprints.model';
import { type CompleteSprintRepository } from '../interfaces/repositories/complete-sprint.repository.interface';
import { type FindSprintRepository } from '../interfaces/repositories/find-sprint.repository.interface';
import {
  CompleteSprintService,
  CompleteSprintServiceInput,
} from '../interfaces/services/complete-sprint.service.interface';
import { SPRINT_TYPES } from '../interfaces/types';

// đổi path theo module task_status của bạn
import { type FindTaskStatusRepository } from 'src/modules/task_status/interfaces/repositories/find.task-status.repository.interface';
import { TASK_STATUS_TYPES } from 'src/modules/task_status/interfaces/types';
import { type MarkDoneTasksCompletedAtInSprintService } from 'src/modules/tasks/interfaces/services/mark-done-tasks-completed-at-in-sprint.service.interface';

@Injectable()
export class CompleteSprintServiceImpl implements CompleteSprintService {
  constructor(
    @Inject(SPRINT_TYPES.repositories.CompleteSprintRepository)
    private readonly completeSprintRepository: CompleteSprintRepository,

    @Inject(SPRINT_TYPES.repositories.FindSprintRepository)
    private readonly findSprintRepository: FindSprintRepository,

    @Inject(TASK_TYPES.services.MoveUnfinishedTasksToBacklogService)
    private readonly moveUnfinishedTasksToBacklogService: MoveUnfinishedTasksToBacklogService,

    @Inject(TASK_STATUS_TYPES.repositories.FindTaskStatusRepository)
    private readonly findTaskStatusRepository: FindTaskStatusRepository,

    @Inject(TASK_TYPES.services.MarkDoneTasksCompletedAtInSprintService)
    private readonly markDoneTasksCompletedAtInSprintService: MarkDoneTasksCompletedAtInSprintService,
  ) {}

  async completeSprint(
    input: CompleteSprintServiceInput,
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

    if (sprint.status !== SprintStatus.ACTIVE) {
      throw new BadRequestException('Only active sprint can be completed');
    }

    const doneStatus = await this.findTaskStatusRepository.findDoneStatus(
      input.projectId,
      input.workspaceId,
      manager,
    );

    if (!doneStatus) {
      throw new BadRequestException('Done status not found');
    }

    const now = new Date();

    await this.markDoneTasksCompletedAtInSprintService.mark(
      {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        sprintId: input.sprintId,
        doneStatusId: doneStatus.id,
        completedAt: now,
      },
      manager,
    );

    await this.moveUnfinishedTasksToBacklogService.move(
      {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        sprintId: input.sprintId,
        doneStatusId: doneStatus.id,
      },
      manager,
    );

    const completedSprint = await this.completeSprintRepository.completeSprint(
      input.sprintId,
      manager,
    );

    if (!completedSprint) {
      throw new NotFoundException('Sprint not found');
    }

    return completedSprint;
  }
}
