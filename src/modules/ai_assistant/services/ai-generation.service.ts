import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AiGenerationModel } from '../domain/models/ai-generation.model';
import { type AiGenerationRepository } from '../interfaces/repositories/ai-generation.repository.interface';
import { AiGenerationService } from '../interfaces/services/ai-generation.service.interface';
import { AI_ASSISTANT_TYPES } from '../interfaces/types';

@Injectable()
export class AiGenerationServiceImpl implements AiGenerationService {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.repositories.AiGenerationRepository)
    private readonly repo: AiGenerationRepository,
  ) {}

  create(
    input: Parameters<AiGenerationService['create']>[0],
    manager?: EntityManager,
  ): Promise<AiGenerationModel> {
    return this.repo.create(input, manager);
  }

  async findByIdForUser(
    generationId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<AiGenerationModel> {
    const generation = await this.repo.findById(generationId, manager);

    if (!generation || generation.userId !== userId) {
      throw new NotFoundException('AI generation not found');
    }

    return generation;
  }

  updateStatus(
    input: Parameters<AiGenerationService['updateStatus']>[0],
    manager?: EntityManager,
  ): Promise<AiGenerationModel> {
    return this.repo.updateStatus(input, manager);
  }

  updateGeneratedResult(
    input: Parameters<AiGenerationService['updateGeneratedResult']>[0],
    manager?: EntityManager,
  ): Promise<AiGenerationModel> {
    return this.repo.updateGeneratedResult(input, manager);
  }

  updateAppliedResults(
    input: Parameters<AiGenerationService['updateAppliedResults']>[0],
    manager?: EntityManager,
  ): Promise<AiGenerationModel> {
    return this.repo.updateAppliedResults(input, manager);
  }
}
