import { EntityManager } from 'typeorm';
import { AiGenerationModel } from '../../domain/models/ai-generation.model';
import {
  SaveAiGenerationInput,
  UpdateAiGenerationAppliedResultsInput,
  UpdateAiGenerationGeneratedResultInput,
  UpdateAiGenerationStatusInput,
} from '../repositories/ai-generation.repository.interface';

export interface AiGenerationService {
  create(
    input: SaveAiGenerationInput,
    manager?: EntityManager,
  ): Promise<AiGenerationModel>;

  findByIdForUser(
    generationId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<AiGenerationModel>;

  updateStatus(
    input: UpdateAiGenerationStatusInput,
    manager?: EntityManager,
  ): Promise<AiGenerationModel>;

  updateGeneratedResult(
    input: UpdateAiGenerationGeneratedResultInput,
    manager?: EntityManager,
  ): Promise<AiGenerationModel>;

  updateAppliedResults(
    input: UpdateAiGenerationAppliedResultsInput,
    manager?: EntityManager,
  ): Promise<AiGenerationModel>;
}
