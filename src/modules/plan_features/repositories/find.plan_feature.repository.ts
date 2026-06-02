import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PlanFeature } from '../domain/entities/plan_feature.entity';
import { PlanFeatureModel } from '../domain/models/plan_feature.model';
import { FindPlanFeatureRepository } from '../interfaces/repositories/find.plan_feature.repository.interface';
import { PlanFeatureMapper } from '../mapper/plan_feature.mapper';

@Injectable()
export class FindPlanFeatureRepositoryImpl implements FindPlanFeatureRepository {
  constructor(
    @InjectRepository(PlanFeature)
    private readonly repo: Repository<PlanFeature>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<PlanFeature> {
    return manager ? manager.getRepository(PlanFeature) : this.repo;
  }

  async findAll(manager?: EntityManager): Promise<PlanFeatureModel[]> {
    const entities = await this.getRepo(manager).find({
      order: {
        createdAt: 'ASC',
      },
    });

    return entities.map((entity) => PlanFeatureMapper.toModel(entity));
  }

  async findById(
    id: string,
    manager?: EntityManager,
  ): Promise<PlanFeatureModel | null> {
    const entity = await this.getRepo(manager).findOne({
      where: { id },
    });

    return entity ? PlanFeatureMapper.toModel(entity) : null;
  }

  async findByPlanAndFeature(
    planId: string,
    featureId: string,
    manager?: EntityManager,
  ): Promise<PlanFeatureModel | null> {
    const entity = await this.getRepo(manager).findOne({
      where: { planId, featureId },
    });

    return entity ? PlanFeatureMapper.toModel(entity) : null;
  }
}
