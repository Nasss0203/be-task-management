import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Feature } from '../domain/entities/feature.entity';
import { FeatureModel } from '../domain/models/feature.model';
import {
  CreateFeatureRepository,
  SaveFeatureInput,
} from '../interfaces/repositories/create.feature.repository.interface';
import { FeatureMapper } from '../mapper/feature.mapper';

@Injectable()
export class CreateFeatureRepositoryImpl implements CreateFeatureRepository {
  constructor(
    @InjectRepository(Feature)
    private readonly repo: Repository<Feature>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Feature> {
    return manager ? manager.getRepository(Feature) : this.repo;
  }

  async save(
    input: SaveFeatureInput,
    manager?: EntityManager,
  ): Promise<FeatureModel> {
    const saved = await this.getRepo(manager).save(
      FeatureMapper.toEntity(input),
    );

    return FeatureMapper.toModel(saved);
  }
}
