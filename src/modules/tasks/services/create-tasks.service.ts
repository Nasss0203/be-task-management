import { Inject, Injectable } from '@nestjs/common';
import type { CreateAtEndTaskPositionService } from 'src/modules/task_position/interfaces/services/create-at-end-task-position.service.interface';
import type { PositionContextRef } from 'src/modules/task_position/interfaces/task-position.input';
import { TASK_POSITION_TYPES } from 'src/modules/task_position/interfaces/types';
import { EntityManager } from 'typeorm';
import { TaskModel } from '../domain/models/task.model';
import { type CreateTaskRepository } from '../interfaces/repositories/create-task.repository.interface';
import {
  CreateTaskService,
  CreateTaskServiceInput,
} from '../interfaces/services/create-task.service.interface';
import { TASK_TYPES } from '../interfaces/types';

@Injectable()
export class CreateTaskServiceImpl implements CreateTaskService {
  constructor(
    @Inject(TASK_TYPES.repositories.CreateTaskRepository)
    private readonly repo: CreateTaskRepository,

    @Inject(TASK_POSITION_TYPES.services.CreateAtEndTaskPositionService)
    private readonly createAtEndTaskPositionService: CreateAtEndTaskPositionService,
  ) {}

  private resolvePositionContext(
    input: Pick<
      CreateTaskServiceInput,
      'projectId' | 'sprintId' | 'positionContext'
    >,
  ): PositionContextRef {
    if (input.positionContext) {
      return input.positionContext;
    }

    if (input.sprintId) {
      return {
        context: 'sprint',
        contextId: input.sprintId,
      };
    }

    return {
      context: 'backlog',
      contextId: input.projectId,
    };
  }

  private async createTaskPositionAtEnd(
    taskId: string,
    input: Pick<
      CreateTaskServiceInput,
      'projectId' | 'sprintId' | 'positionContext'
    >,
    manager?: EntityManager,
  ): Promise<void> {
    const positionContext = this.resolvePositionContext(input);

    await this.createAtEndTaskPositionService.createAtEnd(
      {
        taskId,
        context: positionContext.context,
        contextId: positionContext.contextId,
      },
      manager,
    );
  }

  async create(
    input: CreateTaskServiceInput,
    manager?: EntityManager,
  ): Promise<TaskModel> {
    const nextProjectSeq = await this.repo.getNextProjectSeq(
      input.workspaceId,
      input.projectId,
      manager,
    );
    const createdTask = await this.repo.save(
      {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        parentTaskId: input.parentTaskId ?? null,
        projectSeq: nextProjectSeq,

        title: input.title ?? null,
        description: input.description ?? null,

        statusId: input.statusId,
        priorityId: input.priorityId ?? null,

        createdBy: input.createdBy,

        sprintId: input.sprintId ?? null,
        startAt: input.startAt ?? null,
        dueAt: input.dueAt ?? null,
        completedAt: null,

        estimateMinutes: input.estimateMinutes ?? null,
      },
      manager,
    );

    if (!input.skipPosition) {
      await this.createTaskPositionAtEnd(createdTask.id, input, manager);
    }

    return createdTask;
  }

  async createMany(
    inputs: CreateTaskServiceInput[],
    manager?: EntityManager,
  ): Promise<TaskModel[]> {
    const createdTasks = await this.repo.saveMany(
      inputs.map((item) => ({
        workspaceId: item.workspaceId,
        projectId: item.projectId,
        parentTaskId: item.parentTaskId ?? null,
        projectSeq: item.projectSeq ?? 1,

        title: item.title ?? null,
        description: item.description ?? null,

        statusId: item.statusId,
        priorityId: item.priorityId ?? null,

        createdBy: item.createdBy,

        sprintId: item.sprintId ?? null,
        startAt: item.startAt ?? null,
        dueAt: item.dueAt ?? null,
        completedAt: null,

        estimateMinutes: item.estimateMinutes ?? null,
      })),
      manager,
    );

    for (const [index, createdTask] of createdTasks.entries()) {
      const input = inputs[index];
      if (!input.skipPosition) {
        await this.createTaskPositionAtEnd(createdTask.id, input, manager);
      }
    }

    return createdTasks;
  }
}
