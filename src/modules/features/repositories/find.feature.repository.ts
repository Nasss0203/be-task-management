import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Feature } from '../domain/entities/feature.entity';
import { FeatureModel } from '../domain/models/feature.model';
import { FindFeatureRepository } from '../interfaces/repositories/find.feature.repository.interface';
import { FeatureMapper } from '../mapper/feature.mapper';

@Injectable()
export class FindFeatureRepositoryImpl implements FindFeatureRepository {
  constructor(
    @InjectRepository(Feature)
    private readonly repo: Repository<Feature>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Feature> {
    return manager ? manager.getRepository(Feature) : this.repo;
  }

  async findAll(manager?: EntityManager): Promise<FeatureModel[]> {
    const entities = await this.getRepo(manager).find({
      order: {
        category: 'ASC',
        name: 'ASC',
      },
    });

    return entities.map((entity) => FeatureMapper.toModel(entity));
  }

  async findById(
    id: string,
    manager?: EntityManager,
  ): Promise<FeatureModel | null> {
    const entity = await this.getRepo(manager).findOne({
      where: { id },
    });

    return entity ? FeatureMapper.toModel(entity) : null;
  }

  async findByCode(
    code: string,
    manager?: EntityManager,
  ): Promise<FeatureModel | null> {
    const entity = await this.getRepo(manager).findOne({
      where: { code },
    });

    return entity ? FeatureMapper.toModel(entity) : null;
  }
}
