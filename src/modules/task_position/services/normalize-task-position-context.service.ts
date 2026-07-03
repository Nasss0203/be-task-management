import { Inject, Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { EntityManager } from 'typeorm';
import type { FindAllTaskPositionsRepository } from '../interfaces/repositories/find-all-task-positions.repository.interface';
import type { UpdateManyTaskPositionsRepository } from '../interfaces/repositories/update-many-task-positions.repository.interface';
import type { NormalizeTaskPositionContextService } from '../interfaces/services/normalize-task-position-context.service.interface';
import type { NormalizeTaskPositionContextInput } from '../interfaces/task-position.input';
import { TASK_POSITION_TYPES } from '../interfaces/types';
import { POSITION_SCALE, POSITION_STEP } from '../utils/task-position.util';

@Injectable()
export class NormalizeTaskPositionContextServiceImpl implements NormalizeTaskPositionContextService {
  constructor(
    @Inject(TASK_POSITION_TYPES.repositories.FindAllTaskPositionsRepository)
    private readonly findAllRepository: FindAllTaskPositionsRepository,
    @Inject(TASK_POSITION_TYPES.repositories.UpdateManyTaskPositionsRepository)
    private readonly updateManyRepository: UpdateManyTaskPositionsRepository,
  ) {}

  async normalizeContext(
    input: NormalizeTaskPositionContextInput,
    manager?: EntityManager,
  ): Promise<void> {
    const records = await this.findAllRepository.findAllInContext(
      input,
      manager,
    );

    const updates = records.map((record, index) => ({
      taskId: record.taskId,
      context: input.context,
      contextId: input.contextId,
      position: new Decimal(index + 1)
        .mul(POSITION_STEP)
        .toFixed(POSITION_SCALE),
    }));

    await this.updateManyRepository.updateMany(updates, manager);
  }
}
