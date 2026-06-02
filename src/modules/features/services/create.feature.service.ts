import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { FeatureModel } from '../domain/models/feature.model';
import { CreateFeatureDto } from '../dto/create-feature.dto';
import { type CreateFeatureRepository } from '../interfaces/repositories/create.feature.repository.interface';
import { CreateFeatureService } from '../interfaces/services/create.feature.service.interface';
import { FEATURE_TYPES } from '../interfaces/types';

@Injectable()
export class CreateFeatureServiceImpl implements CreateFeatureService {
  constructor(
    @Inject(FEATURE_TYPES.repositories.CreateFeatureRepository)
    private readonly repo: CreateFeatureRepository,
  ) {}

  create(
    dto: CreateFeatureDto,
    manager?: EntityManager,
  ): Promise<FeatureModel> {
    return this.repo.save(
      {
        ...dto,
        code: dto.code.trim().toUpperCase(),
        isActive: dto.isActive ?? true,
        description: dto.description ?? null,
        category: dto.category ?? null,
        metadata: dto.metadata ?? null,
      },
      manager,
    );
  }
}
