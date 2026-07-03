import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TaskPosition } from '../domain/entities/task_position.entity';
import { FindAllTaskPositionsRepository } from '../interfaces/repositories/find-all-task-positions.repository.interface';
import type { PositionContextRef } from '../interfaces/task-position.input';

@Injectable()
export class FindAllTaskPositionsRepositoryImpl implements FindAllTaskPositionsRepository {
  constructor(
    @InjectRepository(TaskPosition)
    private readonly repo: Repository<TaskPosition>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<TaskPosition> {
    return manager ? manager.getRepository(TaskPosition) : this.repo;
  }

  async findAllInContext(
    input: PositionContextRef,
    manager?: EntityManager,
  ): Promise<TaskPosition[]> {
    const repo = this.getRepo(manager);

    return repo.find({
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
