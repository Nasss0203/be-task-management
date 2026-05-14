import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { SprintStatus } from 'src/modules/sprints/domain/entities/sprint.entity';
import { type FindSprintRepository } from 'src/modules/sprints/interfaces/repositories/find-sprint.repository.interface';
import { SPRINT_TYPES } from 'src/modules/sprints/interfaces/types';

import { TaskModel } from '../domain/models/task.model';
import { type FindTaskRepository } from '../interfaces/repositories/find-task.repository.interface';
import { type MoveTaskSprintToSprintRepository } from '../interfaces/repositories/move-task-sprint-to-sprint.repository.interface';
import {
  MoveTaskSprintToSprintService,
  MoveTaskSprintToSprintServiceInput,
} from '../interfaces/services/move-task-sprint-to-sprint.service.interface';
import { TASK_TYPES } from '../interfaces/types';

@Injectable()
export class MoveTaskSprintToSprintServiceImpl implements MoveTaskSprintToSprintService {
  constructor(
    @Inject(TASK_TYPES.repositories.FindTaskRepository)
    private readonly findTaskRepository: FindTaskRepository,

    @Inject(SPRINT_TYPES.repositories.FindSprintRepository)
    private readonly findSprintRepository: FindSprintRepository,

    @Inject(TASK_TYPES.repositories.MoveTaskSprintToSprintRepository)
    private readonly moveTaskSprintToSprintRepository: MoveTaskSprintToSprintRepository,
  ) {}

  async move(
    input: MoveTaskSprintToSprintServiceInput,
    manager?: EntityManager,
  ): Promise<TaskModel> {
    console.log('🚀 ~ input~1', input);
    const { workspaceId, projectId, taskId, sourceSprintId, targetSprintId } =
      input;

    if (sourceSprintId === targetSprintId) {
      throw new BadRequestException(
        'Source sprint and target sprint must be different',
      );
    }

    const task = await this.findTaskRepository.findOneTask(taskId, manager);
    console.log('🚀 ~ task~2', task);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.workspaceId !== workspaceId) {
      throw new BadRequestException('Task does not belong to this workspace');
    }

    if (task.projectId !== projectId) {
      throw new BadRequestException('Task does not belong to this project');
    }

    if (!task.sprintId) {
      throw new BadRequestException('Task is not in any sprint');
    }

    if (task.sprintId !== sourceSprintId) {
      throw new BadRequestException('Task is not in source sprint');
    }

    const sourceSprint = await this.findSprintRepository.findOneSprint(
      sourceSprintId,
      manager,
    );
    console.log('🚀 ~ sourceSprint~3', sourceSprint);

    if (!sourceSprint) {
      throw new NotFoundException('Source sprint not found');
    }

    if (sourceSprint.workspaceId !== workspaceId) {
      throw new BadRequestException(
        'Source sprint does not belong to this workspace',
      );
    }

    if (sourceSprint.projectId !== projectId) {
      throw new BadRequestException(
        'Source sprint does not belong to this project',
      );
    }

    const targetSprint = await this.findSprintRepository.findOneSprint(
      targetSprintId,
      manager,
    );
    console.log('🚀 ~ targetSprint~4', targetSprint);

    if (!targetSprint) {
      throw new NotFoundException('Target sprint not found');
    }
    console.log('🚀 ~ targetSprint~5');

    if (targetSprint.workspaceId !== workspaceId) {
      throw new BadRequestException(
        'Target sprint does not belong to this workspace',
      );
    }
    console.log('🚀 ~ targetSprint~6');

    if (targetSprint.projectId !== projectId) {
      throw new BadRequestException(
        'Target sprint does not belong to this project',
      );
    }
    console.log('🚀 ~ targetSprint~7');

    if (
      sourceSprint.status === SprintStatus.COMPLETED ||
      sourceSprint.status === SprintStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Cannot move task from completed or cancelled sprint',
      );
    }
    console.log('🚀 ~ targetSprint~8');

    if (
      targetSprint.status === SprintStatus.COMPLETED ||
      targetSprint.status === SprintStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Cannot move task to completed or cancelled sprint',
      );
    }
    console.log('🚀 ~ targetSprint~9');

    return await this.moveTaskSprintToSprintRepository.move(
      {
        workspaceId,
        projectId,
        taskId,
        targetSprintId,
      },
      manager,
    );
  }
}
