import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { EntityManager } from 'typeorm';
import type { TaskPosition } from '../domain/entities/task_position.entity';
import type { FindOneTaskPositionRepository } from '../interfaces/repositories/find-one-task-position.repository.interface';
import type { UpsertTaskPositionRepository } from '../interfaces/repositories/upsert-task-position.repository.interface';
import type { NormalizeTaskPositionContextService } from '../interfaces/services/normalize-task-position-context.service.interface';
import type { ReorderWithinContextTaskPositionService } from '../interfaces/services/reorder-within-context-task-position.service.interface';
import type { ReorderTaskPositionInput } from '../interfaces/task-position.input';
import { TASK_POSITION_TYPES } from '../interfaces/types';
import {
  calculatePosition,
  hasEnoughPositionGap,
} from '../utils/task-position.util';

@Injectable()
export class ReorderWithinContextTaskPositionServiceImpl implements ReorderWithinContextTaskPositionService {
  constructor(
    @Inject(TASK_POSITION_TYPES.repositories.FindOneTaskPositionRepository)
    private readonly findOneRepository: FindOneTaskPositionRepository,
    @Inject(TASK_POSITION_TYPES.repositories.UpsertTaskPositionRepository)
    private readonly upsertRepository: UpsertTaskPositionRepository,
    @Inject(TASK_POSITION_TYPES.services.NormalizeTaskPositionContextService)
    private readonly normalizeService: NormalizeTaskPositionContextService,
  ) {}

  async reorderWithinContext(
    input: ReorderTaskPositionInput,
    manager?: EntityManager,
  ): Promise<TaskPosition> {
    const { taskId, context, contextId, previousTaskId, nextTaskId } = input;

    if (previousTaskId === taskId || nextTaskId === taskId) {
      throw new BadRequestException('Task cannot be used as its own neighbor.');
    }

    if (previousTaskId && nextTaskId && previousTaskId === nextTaskId) {
      throw new BadRequestException(
        'Previous and next task cannot be the same.',
      );
    }

    let previous = previousTaskId
      ? await this.findOneRepository.findOneByTaskAndContext(
          {
            taskId: previousTaskId,
            context,
            contextId,
          },
          manager,
        )
      : null;

    let next = nextTaskId
      ? await this.findOneRepository.findOneByTaskAndContext(
          {
            taskId: nextTaskId,
            context,
            contextId,
          },
          manager,
        )
      : null;

    if (previousTaskId && !previous) {
      throw new BadRequestException(
        'Previous task does not exist in the target context.',
      );
    }

    if (nextTaskId && !next) {
      throw new BadRequestException(
        'Next task does not exist in the target context.',
      );
    }

    if (
      previous &&
      next &&
      new Decimal(previous.position).greaterThanOrEqualTo(next.position)
    ) {
      throw new BadRequestException('Previous task must be before next task.');
    }

    if (
      previous &&
      next &&
      !hasEnoughPositionGap({
        previousPosition: previous.position,
        nextPosition: next.position,
      })
    ) {
      await this.normalizeService.normalizeContext(
        {
          context,
          contextId,
        },
        manager,
      );

      previous = await this.findOneRepository.findOneByTaskAndContext(
        {
          taskId: previous.taskId,
          context,
          contextId,
        },
        manager,
      );
      next = await this.findOneRepository.findOneByTaskAndContext(
        {
          taskId: next.taskId,
          context,
          contextId,
        },
        manager,
      );
    }

    const position = calculatePosition({
      previousPosition: previous?.position ?? null,
      nextPosition: next?.position ?? null,
    });

    return this.upsertRepository.upsert(
      {
        taskId,
        context,
        contextId,
        position,
      },
      manager,
    );
  }
}
