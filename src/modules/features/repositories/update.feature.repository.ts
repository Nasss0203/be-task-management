import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Feature } from '../domain/entities/feature.entity';
import { FeatureModel } from '../domain/models/feature.model';
import {
  UpdateFeatureInput,
  UpdateFeatureRepository,
} from '../interfaces/repositories/update.feature.repository.interface';
import { FeatureMapper } from '../mapper/feature.mapper';

@Injectable()
export class UpdateFeatureRepositoryImpl implements UpdateFeatureRepository {
  constructor(
    @InjectRepository(Feature)
    private readonly repo: Repository<Feature>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Feature> {
    return manager ? manager.getRepository(Feature) : this.repo;
  }

  async save(
    input: UpdateFeatureInput,
    manager?: EntityManager,
  ): Promise<FeatureModel> {
    const repo = this.getRepo(manager);
    const entity = await repo.findOne({ where: { id: input.id } });

    if (!entity) {
      throw new NotFoundException('Feature not found');
    }

    Object.assign(entity, input);
    const saved = await repo.save(entity);

    return FeatureMapper.toModel(saved);
  }
}
