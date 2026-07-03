import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TaskPosition } from '../domain/entities/task_position.entity';
import { UpdateManyTaskPositionsRepository } from '../interfaces/repositories/update-many-task-positions.repository.interface';
import type { CreateTaskPositionRecordInput } from '../interfaces/task-position.input';

@Injectable()
export class UpdateManyTaskPositionsRepositoryImpl implements UpdateManyTaskPositionsRepository {
  constructor(
    @InjectRepository(TaskPosition)
    private readonly repo: Repository<TaskPosition>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<TaskPosition> {
    return manager ? manager.getRepository(TaskPosition) : this.repo;
  }

  async updateMany(
    inputs: CreateTaskPositionRecordInput[],
    manager?: EntityManager,
  ): Promise<void> {
    if (inputs.length === 0) {
      return;
    }

    const repo = this.getRepo(manager);

    await repo.upsert(
      inputs.map((input) => ({
        taskId: input.taskId,
        context: input.context,
        contextId: input.contextId,
        position: input.position,
      })),
      ['taskId', 'context', 'contextId'],
    );
  }
}
