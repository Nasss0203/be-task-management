import { EntityManager } from 'typeorm';
import { PlanFeatureModel } from '../../domain/models/plan_feature.model';
import { CreatePlanFeatureDto } from '../../dto/create-plan_feature.dto';

export interface CreatePlanFeatureService {
  create(
    dto: CreatePlanFeatureDto,
    manager?: EntityManager,
  ): Promise<PlanFeatureModel>;
}
