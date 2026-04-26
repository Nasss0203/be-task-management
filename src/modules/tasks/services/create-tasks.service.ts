import { Inject, Injectable } from '@nestjs/common';
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
  ) {}

  async create(
    input: CreateTaskServiceInput,
    manager?: EntityManager,
  ): Promise<TaskModel> {
    return await this.repo.save(
      {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        projectSeq: input.projectSeq ?? 1,

        title: input.title,
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
  }

  async createMany(
    inputs: CreateTaskServiceInput[],
    manager?: EntityManager,
  ): Promise<TaskModel[]> {
    return await this.repo.saveMany(
      inputs.map((item) => ({
        workspaceId: item.workspaceId,
        projectId: item.projectId,
        projectSeq: item.projectSeq ?? 1,

        title: item.title,
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
  }
}
