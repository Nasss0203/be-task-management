import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { AI_ASSISTANT_TYPES } from '../../../ai-assistant.types';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';
import { InvalidAiGenerationTransitionException } from '../../../domain/exceptions/invalid-ai-generation-transition.exception';
import { AiGenerationResponseDto } from '../../dto/response/ai-generation.response.dto';
import { DiscardGenerationCommand } from './discard-generation.command';

@Injectable()
export class DiscardGenerationHandler {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiGenerationRepository)
    private readonly generationRepository: AiGenerationRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    command: DiscardGenerationCommand,
    context?: PersistenceContext,
  ): Promise<AiGenerationResponseDto> {
    const discard = async (transaction: PersistenceContext) => {
      // Same row lock as Confirm. A losing request sees APPLIED/DISCARDED
      // after the winning transaction commits and cannot change the status.
      const generation =
        await this.generationRepository.findByIdAndUserIdForUpdate(
          command.generationId,
          command.userId,
          transaction,
        );

      if (!generation) {
        throw new NotFoundException('AI generation not found');
      }

      try {
        generation.discard();
      } catch (error) {
        if (error instanceof InvalidAiGenerationTransitionException) {
          throw new ConflictException('This AI draft has already been applied or discarded.');
        }
        throw error;
      }
      const saved = await this.generationRepository.save(
        generation,
        transaction,
      );
      return AiGenerationResponseDto.fromDomain(saved);
    };

    return context !== undefined
      ? discard(context)
      : this.unitOfWork.runInTransaction(discard);
  }
}
