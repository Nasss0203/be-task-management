import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import type { DeleteTaskPositionRepository } from '../interfaces/repositories/delete-task-position.repository.interface';
import type { RemoveTaskPositionFromContextService } from '../interfaces/services/remove-task-position-from-context.service.interface';
import type { RemoveTaskPositionInput } from '../interfaces/task-position.input';
import { TASK_POSITION_TYPES } from '../interfaces/types';

@Injectable()
export class RemoveTaskPositionFromContextServiceImpl implements RemoveTaskPositionFromContextService {
  constructor(
    @Inject(TASK_POSITION_TYPES.repositories.DeleteTaskPositionRepository)
    private readonly deleteRepository: DeleteTaskPositionRepository,
  ) {}

  async removeFromContext(
    input: RemoveTaskPositionInput,
    manager?: EntityManager,
  ): Promise<void> {
    await this.deleteRepository.deleteByTaskAndContext(input, manager);
  }
}
