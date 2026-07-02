import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import type { TaskPosition } from '../domain/entities/task_position.entity';
import type { CreateTaskPositionRepository } from '../interfaces/repositories/create-task-position.repository.interface';
import type { FindLastTaskPositionRepository } from '../interfaces/repositories/find-last-task-position.repository.interface';
import type { CreateAtEndTaskPositionService } from '../interfaces/services/create-at-end-task-position.service.interface';
import type { CreateTaskPositionAtEndInput } from '../interfaces/task-position.input';
import { TASK_POSITION_TYPES } from '../interfaces/types';
import { calculatePosition } from '../utils/task-position.util';

@Injectable()
export class CreateAtEndTaskPositionServiceImpl implements CreateAtEndTaskPositionService {
  constructor(
    @Inject(TASK_POSITION_TYPES.repositories.FindLastTaskPositionRepository)
    private readonly findLastRepository: FindLastTaskPositionRepository,
    @Inject(TASK_POSITION_TYPES.repositories.CreateTaskPositionRepository)
    private readonly createRepository: CreateTaskPositionRepository,
  ) {}

  async createAtEnd(
    input: CreateTaskPositionAtEndInput,
    manager?: EntityManager,
  ): Promise<TaskPosition> {
    const last = await this.findLastRepository.findLastInContext(
      {
        context: input.context,
        contextId: input.contextId,
      },
      manager,
    );

    const position = calculatePosition({
      previousPosition: last?.position ?? null,
      nextPosition: null,
    });

    return this.createRepository.create(
      {
        taskId: input.taskId,
        context: input.context,
        contextId: input.contextId,
        position,
      },
      manager,
    );
  }
}
