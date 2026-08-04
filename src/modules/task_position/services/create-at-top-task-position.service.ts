import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import type { TaskPosition } from '../domain/entities/task_position.entity';
import type { UpsertTaskPositionRepository } from '../interfaces/repositories/upsert-task-position.repository.interface';
import type { FindFirstTaskPositionRepository } from '../interfaces/repositories/find-first-task-position.repository.interface';
import type { CreateAtTopTaskPositionService } from '../interfaces/services/create-at-top-task-position.service.interface';
import type { CreateTaskPositionAtEndInput } from '../interfaces/task-position.input';
import { TASK_POSITION_TYPES } from '../interfaces/types';
import { calculatePosition } from '../utils/task-position.util';

@Injectable()
export class CreateAtTopTaskPositionServiceImpl implements CreateAtTopTaskPositionService {
  constructor(
    @Inject(TASK_POSITION_TYPES.repositories.FindFirstTaskPositionRepository)
    private readonly findFirstRepository: FindFirstTaskPositionRepository,
    @Inject(TASK_POSITION_TYPES.repositories.UpsertTaskPositionRepository)
    private readonly upsertRepository: UpsertTaskPositionRepository,
  ) {}

  async createAtTop(
    input: CreateTaskPositionAtEndInput,
    manager?: EntityManager,
  ): Promise<TaskPosition> {
    const first = await this.findFirstRepository.findFirstInContext(
      {
        context: input.context,
        contextId: input.contextId,
      },
      manager,
    );

    const position = calculatePosition({
      previousPosition: null,
      nextPosition: first?.position ?? null,
    });

    return this.upsertRepository.upsert(
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
