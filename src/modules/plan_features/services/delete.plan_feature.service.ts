import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { type DeletePlanFeatureRepository } from '../interfaces/repositories/delete.plan_feature.repository.interface';
import { DeletePlanFeatureService } from '../interfaces/services/delete.plan_feature.service.interface';
import { type FindPlanFeatureService } from '../interfaces/services/find.plan_feature.service.interface';
import { PLAN_FEATURE_TYPES } from '../interfaces/types';

@Injectable()
export class DeletePlanFeatureServiceImpl implements DeletePlanFeatureService {
  constructor(
    @Inject(PLAN_FEATURE_TYPES.services.FindPlanFeatureService)
    private readonly findService: FindPlanFeatureService,

    @Inject(PLAN_FEATURE_TYPES.repositories.DeletePlanFeatureRepository)
    private readonly repo: DeletePlanFeatureRepository,
  ) {}

  async delete(id: string, manager?: EntityManager): Promise<void> {
    await this.findService.findById(id, manager);
    await this.repo.softDelete(id, manager);
  }
}
