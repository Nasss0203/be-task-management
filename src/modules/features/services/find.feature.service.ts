import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { FeatureModel } from '../domain/models/feature.model';
import { type FindFeatureRepository } from '../interfaces/repositories/find.feature.repository.interface';
import { FindFeatureService } from '../interfaces/services/find.feature.service.interface';
import { FEATURE_TYPES } from '../interfaces/types';

@Injectable()
export class FindFeatureServiceImpl implements FindFeatureService {
  constructor(
    @Inject(FEATURE_TYPES.repositories.FindFeatureRepository)
    private readonly repo: FindFeatureRepository,
  ) {}

  findAll(manager?: EntityManager): Promise<FeatureModel[]> {
    return this.repo.findAll(manager);
  }

  async findById(id: string, manager?: EntityManager): Promise<FeatureModel> {
    const feature = await this.repo.findById(id, manager);

    if (!feature) {
      throw new NotFoundException('Feature not found');
    }

    return feature;
  }

  async findByCode(
    code: string,
    manager?: EntityManager,
  ): Promise<FeatureModel> {
    const feature = await this.repo.findByCode(code, manager);

    if (!feature) {
      throw new NotFoundException('Feature not found');
    }

    return feature;
  }
}
