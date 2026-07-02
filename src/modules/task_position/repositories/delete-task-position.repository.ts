import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TaskPosition } from '../domain/entities/task_position.entity';
import { DeleteTaskPositionRepository } from '../interfaces/repositories/delete-task-position.repository.interface';
import type { TaskPositionRef } from '../interfaces/task-position.input';

@Injectable()
export class DeleteTaskPositionRepositoryImpl implements DeleteTaskPositionRepository {
  constructor(
    @InjectRepository(TaskPosition)
    private readonly repo: Repository<TaskPosition>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<TaskPosition> {
    return manager ? manager.getRepository(TaskPosition) : this.repo;
  }

  async deleteByTaskAndContext(
    input: TaskPositionRef,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);

    await repo.delete({
      taskId: input.taskId,
      context: input.context,
      contextId: input.contextId,
    });
  }
}
