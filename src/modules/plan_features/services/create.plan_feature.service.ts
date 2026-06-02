import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PlanFeatureModel } from '../domain/models/plan_feature.model';
import { CreatePlanFeatureDto } from '../dto/create-plan_feature.dto';
import { type CreatePlanFeatureRepository } from '../interfaces/repositories/create.plan_feature.repository.interface';
import { CreatePlanFeatureService } from '../interfaces/services/create.plan_feature.service.interface';
import { PLAN_FEATURE_TYPES } from '../interfaces/types';

@Injectable()
export class CreatePlanFeatureServiceImpl implements CreatePlanFeatureService {
  constructor(
    @Inject(PLAN_FEATURE_TYPES.repositories.CreatePlanFeatureRepository)
    private readonly repo: CreatePlanFeatureRepository,
  ) {}

  create(
    dto: CreatePlanFeatureDto,
    manager?: EntityManager,
  ): Promise<PlanFeatureModel> {
    return this.repo.save(
      {
        planId: dto.planId,
        featureId: dto.featureId,
        enabled: dto.enabled ?? true,
        metadata: dto.metadata ?? null,
      },
      manager,
    );
  }
}
