import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PlanFeature } from '../domain/entities/plan_feature.entity';
import { PlanFeatureModel } from '../domain/models/plan_feature.model';
import {
  CreatePlanFeatureRepository,
  SavePlanFeatureInput,
} from '../interfaces/repositories/create.plan_feature.repository.interface';
import { PlanFeatureMapper } from '../mapper/plan_feature.mapper';

@Injectable()
export class CreatePlanFeatureRepositoryImpl implements CreatePlanFeatureRepository {
  constructor(
    @InjectRepository(PlanFeature)
    private readonly repo: Repository<PlanFeature>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<PlanFeature> {
    return manager ? manager.getRepository(PlanFeature) : this.repo;
  }

  async save(
    input: SavePlanFeatureInput,
    manager?: EntityManager,
  ): Promise<PlanFeatureModel> {
    const entity = PlanFeatureMapper.toEntity(input);
    const saved = await this.getRepo(manager).save(entity);

    return PlanFeatureMapper.toModel(saved);
  }
}
