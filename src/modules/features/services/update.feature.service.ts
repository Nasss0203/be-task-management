import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { FeatureModel } from '../domain/models/feature.model';
import { UpdateFeatureDto } from '../dto/update-feature.dto';
import { type UpdateFeatureRepository } from '../interfaces/repositories/update.feature.repository.interface';
import { UpdateFeatureService } from '../interfaces/services/update.feature.service.interface';
import { FEATURE_TYPES } from '../interfaces/types';

@Injectable()
export class UpdateFeatureServiceImpl implements UpdateFeatureService {
  constructor(
    @Inject(FEATURE_TYPES.repositories.UpdateFeatureRepository)
    private readonly repo: UpdateFeatureRepository,
  ) {}

  update(
    id: string,
    dto: UpdateFeatureDto,
    manager?: EntityManager,
  ): Promise<FeatureModel> {
    return this.repo.save(
      {
        id,
        ...dto,
        ...(dto.code !== undefined && { code: dto.code.trim().toUpperCase() }),
      },
      manager,
    );
  }
}
