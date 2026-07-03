import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TaskPosition } from '../domain/entities/task_position.entity';
import { FindFirstTaskPositionRepository } from '../interfaces/repositories/find-first-task-position.repository.interface';
import type { PositionContextRef } from '../interfaces/task-position.input';

@Injectable()
export class FindFirstTaskPositionRepositoryImpl implements FindFirstTaskPositionRepository {
  constructor(
    @InjectRepository(TaskPosition)
    private readonly repo: Repository<TaskPosition>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<TaskPosition> {
    return manager ? manager.getRepository(TaskPosition) : this.repo;
  }

  async findFirstInContext(
    input: PositionContextRef,
    manager?: EntityManager,
  ): Promise<TaskPosition | null> {
    const repo = this.getRepo(manager);

    return repo.findOne({
      where: {
        context: input.context,
        contextId: input.contextId,
      },
      order: {
        position: 'ASC',
      },
    });
  }
}
