import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Task } from '../domain/entities/task.entity';
import { DeleteTaskRepository } from '../interfaces/repositories/delete-task.repository.interface';

@Injectable()
export class DeleteTaskRepositoryImpl implements DeleteTaskRepository {
  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Task> {
    return manager ? manager.getRepository(Task) : this.repo;
  }

  async softDeleteTask(
    input: {
      taskId: string;
      deletedBy: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);

    await repo.update(
      { id: input.taskId },
      {
        deletedAt: new Date(),
        deletedBy: input.deletedBy,
      },
    );
  }

  async restoreTask(
    input: {
      taskId: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);

    await repo.update(
      { id: input.taskId },
      {
        deletedAt: null,
        deletedBy: null,
      },
    );
  }
}
