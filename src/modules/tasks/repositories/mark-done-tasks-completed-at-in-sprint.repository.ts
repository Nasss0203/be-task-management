// src/modules/tasks/repositories/mark-done-tasks-completed-at-in-sprint.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Task } from '../domain/entities/task.entity';
import {
  MarkDoneTasksCompletedAtInSprintRepository,
  MarkDoneTasksCompletedAtInSprintRepositoryInput,
} from '../interfaces/repositories/mark-done-tasks-completed-at-in-sprint.repository.interface';

@Injectable()
export class MarkDoneTasksCompletedAtInSprintRepositoryImpl implements MarkDoneTasksCompletedAtInSprintRepository {
  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Task> {
    return manager ? manager.getRepository(Task) : this.repo;
  }

  async mark(
    input: MarkDoneTasksCompletedAtInSprintRepositoryInput,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);

    await repo
      .createQueryBuilder()
      .update(Task)
      .set({
        completedAt: input.completedAt,
      })
      .where('workspace_id = :workspaceId', {
        workspaceId: input.workspaceId,
      })
      .andWhere('project_id = :projectId', {
        projectId: input.projectId,
      })
      .andWhere('sprint_id = :sprintId', {
        sprintId: input.sprintId,
      })
      .andWhere('status_id = :doneStatusId', {
        doneStatusId: input.doneStatusId,
      })
      .andWhere('completed_at IS NULL')
      .andWhere('deleted_at IS NULL')
      .execute();
  }
}
