import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TaskPosition } from '../domain/entities/task_position.entity';
import { UpsertTaskPositionRepository } from '../interfaces/repositories/upsert-task-position.repository.interface';
import type { CreateTaskPositionRecordInput } from '../interfaces/task-position.input';

@Injectable()
export class UpsertTaskPositionRepositoryImpl implements UpsertTaskPositionRepository {
  constructor(
    @InjectRepository(TaskPosition)
    private readonly repo: Repository<TaskPosition>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<TaskPosition> {
    return manager ? manager.getRepository(TaskPosition) : this.repo;
  }

  async upsert(
    input: CreateTaskPositionRecordInput,
    manager?: EntityManager,
  ): Promise<TaskPosition> {
    const repo = this.getRepo(manager);

    await repo.upsert(
      {
        taskId: input.taskId,
        context: input.context,
        contextId: input.contextId,
        position: input.position,
      },
      ['taskId', 'context', 'contextId'],
    );

    const saved = await repo.findOne({
      where: {
        taskId: input.taskId,
        context: input.context,
        contextId: input.contextId,
      },
    });

    if (!saved) {
      throw new Error('Task position was not found after upsert.');
    }

    return saved;
  }
}
