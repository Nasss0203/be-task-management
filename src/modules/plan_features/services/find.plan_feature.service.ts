import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PlanFeatureModel } from '../domain/models/plan_feature.model';
import { type FindPlanFeatureRepository } from '../interfaces/repositories/find.plan_feature.repository.interface';
import { FindPlanFeatureService } from '../interfaces/services/find.plan_feature.service.interface';
import { PLAN_FEATURE_TYPES } from '../interfaces/types';

@Injectable()
export class FindPlanFeatureServiceImpl implements FindPlanFeatureService {
  constructor(
    @Inject(PLAN_FEATURE_TYPES.repositories.FindPlanFeatureRepository)
    private readonly repo: FindPlanFeatureRepository,
  ) {}

  findAll(manager?: EntityManager): Promise<PlanFeatureModel[]> {
    return this.repo.findAll(manager);
  }

  async findById(
    id: string,
    manager?: EntityManager,
  ): Promise<PlanFeatureModel> {
    const planFeature = await this.repo.findById(id, manager);

    if (!planFeature) {
      throw new NotFoundException('Plan feature not found');
    }

    return planFeature;
  }

  async findByPlanAndFeature(
    planId: string,
    featureId: string,
    manager?: EntityManager,
  ): Promise<PlanFeatureModel> {
    const planFeature = await this.repo.findByPlanAndFeature(
      planId,
      featureId,
      manager,
    );

    if (!planFeature) {
      throw new NotFoundException('Plan feature not found');
    }

    return planFeature;
  }
}
