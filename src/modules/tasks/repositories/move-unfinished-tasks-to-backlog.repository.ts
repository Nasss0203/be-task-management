import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Task } from '../domain/entities/task.entity';
import { MoveUnfinishedTasksToBacklogRepository } from '../interfaces/repositories/move-unfinished-tasks-to-backlog.repository.interface';

@Injectable()
export class MoveUnfinishedTasksToBacklogRepositoryImpl implements MoveUnfinishedTasksToBacklogRepository {
  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Task> {
    return manager ? manager.getRepository(Task) : this.repo;
  }

  async move(
    workspaceId: string,
    projectId: string,
    sprintId: string,
    doneStatusId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const repo = this.getRepo(manager);

    const result = await repo
      .createQueryBuilder()
      .update(Task)
      .set({
        sprintId: null,
      })
      .where('workspace_id = :workspaceId', { workspaceId })
      .andWhere('project_id = :projectId', { projectId })
      .andWhere('sprint_id = :sprintId', { sprintId })
      .andWhere('status_id != :doneStatusId', { doneStatusId })
      .andWhere('deleted_at IS NULL')
      .execute();

    return result.affected ?? 0;
  }
}
