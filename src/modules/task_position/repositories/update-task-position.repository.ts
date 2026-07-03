import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TaskPosition } from '../domain/entities/task_position.entity';
import { UpdateTaskPositionRepository } from '../interfaces/repositories/update-task-position.repository.interface';
import type { CreateTaskPositionRecordInput } from '../interfaces/task-position.input';

@Injectable()
export class UpdateTaskPositionRepositoryImpl implements UpdateTaskPositionRepository {
  constructor(
    @InjectRepository(TaskPosition)
    private readonly repo: Repository<TaskPosition>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<TaskPosition> {
    return manager ? manager.getRepository(TaskPosition) : this.repo;
  }

  async updatePosition(
    input: CreateTaskPositionRecordInput,
    manager?: EntityManager,
  ): Promise<TaskPosition> {
    const repo = this.getRepo(manager);

    await repo.update(
      {
        taskId: input.taskId,
        context: input.context,
        contextId: input.contextId,
      },
      {
        position: input.position,
      },
    );

    const updated = await repo.findOne({
      where: {
        taskId: input.taskId,
        context: input.context,
        contextId: input.contextId,
      },
    });

    if (!updated) {
      throw new Error('Task position was not found after update.');
    }

    return updated;
  }
}
