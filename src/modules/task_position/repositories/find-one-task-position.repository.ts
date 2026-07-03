import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TaskPosition } from '../domain/entities/task_position.entity';
import { FindOneTaskPositionRepository } from '../interfaces/repositories/find-one-task-position.repository.interface';
import type { TaskPositionRef } from '../interfaces/task-position.input';

@Injectable()
export class FindOneTaskPositionRepositoryImpl implements FindOneTaskPositionRepository {
  constructor(
    @InjectRepository(TaskPosition)
    private readonly repo: Repository<TaskPosition>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<TaskPosition> {
    return manager ? manager.getRepository(TaskPosition) : this.repo;
  }

  async findOneByTaskAndContext(
    input: TaskPositionRef,
    manager?: EntityManager,
  ): Promise<TaskPosition | null> {
    const repo = this.getRepo(manager);

    return repo.findOne({
      where: {
        taskId: input.taskId,
        context: input.context,
        contextId: input.contextId,
      },
    });
  }
}
