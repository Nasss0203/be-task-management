import { Inject, Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { EntityManager } from 'typeorm';
import type { UpdateManyTaskPositionsRepository } from '../interfaces/repositories/update-many-task-positions.repository.interface';
import type { InitializeTaskPositionsService } from '../interfaces/services/initialize-task-positions.service.interface';
import type { InitializeTaskPositionsInput } from '../interfaces/task-position.input';
import { TASK_POSITION_TYPES } from '../interfaces/types';
import { POSITION_SCALE, POSITION_STEP } from '../utils/task-position.util';

@Injectable()
export class InitializeTaskPositionsServiceImpl implements InitializeTaskPositionsService {
  constructor(
    @Inject(TASK_POSITION_TYPES.repositories.UpdateManyTaskPositionsRepository)
    private readonly updateManyRepository: UpdateManyTaskPositionsRepository,
  ) {}

  async initializePositions(
    input: InitializeTaskPositionsInput,
    manager?: EntityManager,
  ): Promise<void> {
    const rows = input.taskIds.map((taskId, index) => ({
      taskId,
      context: input.context,
      contextId: input.contextId,
      position: new Decimal(index + 1)
        .mul(POSITION_STEP)
        .toFixed(POSITION_SCALE),
    }));

    await this.updateManyRepository.updateMany(rows, manager);
  }
}
