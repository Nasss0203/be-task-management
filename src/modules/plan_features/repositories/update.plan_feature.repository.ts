import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PlanFeature } from '../domain/entities/plan_feature.entity';
import { PlanFeatureModel } from '../domain/models/plan_feature.model';
import {
  UpdatePlanFeatureInput,
  UpdatePlanFeatureRepository,
} from '../interfaces/repositories/update.plan_feature.repository.interface';
import { PlanFeatureMapper } from '../mapper/plan_feature.mapper';

@Injectable()
export class UpdatePlanFeatureRepositoryImpl
  implements UpdatePlanFeatureRepository
{
  constructor(
    @InjectRepository(PlanFeature)
    private readonly repo: Repository<PlanFeature>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<PlanFeature> {
    return manager ? manager.getRepository(PlanFeature) : this.repo;
  }

  async save(
    input: UpdatePlanFeatureInput,
    manager?: EntityManager,
  ): Promise<PlanFeatureModel> {
    const saved = await this.getRepo(manager).save(PlanFeatureMapper.toEntity(input));

    return PlanFeatureMapper.toModel(saved);
  }
}
