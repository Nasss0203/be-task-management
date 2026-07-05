import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AiGeneration } from '../domain/entities/ai-generation.entity';
import { AiGenerationModel } from '../domain/models/ai-generation.model';
import {
  AiGenerationRepository,
  SaveAiGenerationInput,
  UpdateAiGenerationAppliedResultsInput,
  UpdateAiGenerationGeneratedResultInput,
  UpdateAiGenerationStatusInput,
} from '../interfaces/repositories/ai-generation.repository.interface';
import { AiGenerationMapper } from '../mapper/ai-generation.mapper';

@Injectable()
export class AiGenerationRepositoryImpl implements AiGenerationRepository {
  constructor(
    @InjectRepository(AiGeneration)
    private readonly repo: Repository<AiGeneration>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<AiGeneration> {
    return manager ? manager.getRepository(AiGeneration) : this.repo;
  }

  async create(
    input: SaveAiGenerationInput,
    manager?: EntityManager,
  ): Promise<AiGenerationModel> {
    const saved = await this.getRepo(manager).save(
      AiGenerationMapper.toEntity(input),
    );

    return AiGenerationMapper.toModel(saved);
  }

  async findById(
    id: string,
    manager?: EntityManager,
  ): Promise<AiGenerationModel | null> {
    const entity = await this.getRepo(manager).findOne({
      where: { id },
    });

    return entity ? AiGenerationMapper.toModel(entity) : null;
  }

  async updateStatus(
    input: UpdateAiGenerationStatusInput,
    manager?: EntityManager,
  ): Promise<AiGenerationModel> {
    const repo = this.getRepo(manager);
    const entity = await repo.findOne({
      where: { id: input.id, userId: input.userId },
    });

    if (!entity) {
      throw new NotFoundException('AI generation not found');
    }

    entity.status = input.status;

    if (input.errorMessage !== undefined) {
      entity.errorMessage = input.errorMessage ?? null;
    }

    const saved = await repo.save(entity);

    return AiGenerationMapper.toModel(saved);
  }

  async updateGeneratedResult(
    input: UpdateAiGenerationGeneratedResultInput,
    manager?: EntityManager,
  ): Promise<AiGenerationModel> {
    const repo = this.getRepo(manager);
    const entity = await repo.findOne({
      where: { id: input.id, userId: input.userId },
    });

    if (!entity) {
      throw new NotFoundException('AI generation not found');
    }

    entity.status = input.status;
    entity.outputData = input.outputData;
    entity.provider = input.provider;
    entity.model = input.model;
    entity.inputTokens = input.inputTokens ?? null;
    entity.outputTokens = input.outputTokens ?? null;
    entity.totalTokens = input.totalTokens ?? null;
    entity.errorMessage = null;

    const saved = await repo.save(entity);

    return AiGenerationMapper.toModel(saved);
  }

  async updateAppliedResults(
    input: UpdateAiGenerationAppliedResultsInput,
    manager?: EntityManager,
  ): Promise<AiGenerationModel> {
    const repo = this.getRepo(manager);
    const entity = await repo.findOne({
      where: { id: input.id, userId: input.userId },
    });

    if (!entity) {
      throw new NotFoundException('AI generation not found');
    }

    entity.appliedResults = input.appliedResults;
    entity.appliedAt = input.appliedAt;
    entity.status = input.status;

    const saved = await repo.save(entity);

    return AiGenerationMapper.toModel(saved);
  }
}
