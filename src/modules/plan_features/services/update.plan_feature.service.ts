import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PlanFeatureModel } from '../domain/models/plan_feature.model';
import { UpdatePlanFeatureDto } from '../dto/update-plan_feature.dto';
import { type FindPlanFeatureService } from '../interfaces/services/find.plan_feature.service.interface';
import { UpdatePlanFeatureService } from '../interfaces/services/update.plan_feature.service.interface';
import { type UpdatePlanFeatureRepository } from '../interfaces/repositories/update.plan_feature.repository.interface';
import { PLAN_FEATURE_TYPES } from '../interfaces/types';

@Injectable()
export class UpdatePlanFeatureServiceImpl implements UpdatePlanFeatureService {
  constructor(
    @Inject(PLAN_FEATURE_TYPES.services.FindPlanFeatureService)
    private readonly findService: FindPlanFeatureService,

    @Inject(PLAN_FEATURE_TYPES.repositories.UpdatePlanFeatureRepository)
    private readonly repo: UpdatePlanFeatureRepository,
  ) {}

  async update(
    id: string,
    dto: UpdatePlanFeatureDto,
    manager?: EntityManager,
  ): Promise<PlanFeatureModel> {
    const current = await this.findService.findById(id, manager);

    return this.repo.save(
      {
        id: current.id,
        planId: dto.planId ?? current.planId,
        featureId: dto.featureId ?? current.featureId,
        enabled: dto.enabled ?? current.enabled,
        metadata:
          dto.metadata !== undefined ? dto.metadata : current.metadata,
        createdAt: current.createdAt,
        updatedAt: current.updatedAt,
        deletedAt: current.deletedAt,
      },
      manager,
    );
  }
}
