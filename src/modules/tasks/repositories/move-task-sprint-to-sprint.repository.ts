import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Task } from '../domain/entities/task.entity';
import { TaskModel } from '../domain/models/task.model';
import {
  MoveTaskSprintToSprintRepository,
  MoveTaskSprintToSprintRepositoryInput,
} from '../interfaces/repositories/move-task-sprint-to-sprint.repository.interface';
import { TaskMapper } from '../mapper/tasks.mapper';

export class MoveTaskSprintToSprintRepositoryImpl implements MoveTaskSprintToSprintRepository {
  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Task> {
    return manager ? manager.getRepository(Task) : this.repo;
  }

  async move(
    input: MoveTaskSprintToSprintRepositoryInput,
    manager?: EntityManager,
  ): Promise<TaskModel> {
    const repo = this.getRepo(manager);

    await repo.update(
      {
        id: input.taskId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
      },
      {
        sprintId: input.targetSprintId,
      },
    );

    const task = await repo.findOne({
      where: {
        id: input.taskId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return TaskMapper.toModel(task);
  }
}
