// src/modules/tasks/repositories/move-tasks-to-backlog-by-sprint.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Task } from '../domain/entities/task.entity';
import {
  MoveTasksToBacklogBySprintRepository,
  MoveTasksToBacklogBySprintRepositoryInput,
} from '../interfaces/repositories/move-tasks-to-backlog-by-sprint.repository.interface';

@Injectable()
export class MoveTasksToBacklogBySprintRepositoryImpl implements MoveTasksToBacklogBySprintRepository {
  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Task> {
    return manager ? manager.getRepository(Task) : this.repo;
  }

  async move(
    input: MoveTasksToBacklogBySprintRepositoryInput,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);

    await repo
      .createQueryBuilder()
      .update(Task)
      .set({
        sprintId: null,
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
      .andWhere('deleted_at IS NULL')
      .execute();
  }
}
