import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Task } from '../domain/entities/task.entity';
import { TaskModel } from '../domain/models/task.model';
import { MoveTaskSprintRepository } from '../interfaces/repositories/move-task-sprint.repository.interface';
import { TaskMapper } from '../mapper/tasks.mapper';

@Injectable()
export class MoveTaskSprintRepositoryImpl implements MoveTaskSprintRepository {
  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Task> {
    return manager ? manager.getRepository(Task) : this.repo;
  }

  async moveTaskToSprint(
    taskId: string,
    sprintId: string | null,
    manager?: EntityManager,
  ): Promise<TaskModel> {
    const repo = this.getRepo(manager);

    await repo.update({ id: taskId }, { sprintId });

    const task = await repo.findOne({
      where: { id: taskId },
      relations: {
        status: true,
        priority: true,
        assignees: {
          user: true,
          assignedByUser: true,
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return TaskMapper.toModel(task);
  }
}
