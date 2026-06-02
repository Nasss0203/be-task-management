import { EntityManager } from 'typeorm';
import { PlanFeatureModel } from '../../domain/models/plan_feature.model';
import { SavePlanFeatureInput } from './create.plan_feature.repository.interface';

export type UpdatePlanFeatureInput = SavePlanFeatureInput & {
  id: string;
};

export interface UpdatePlanFeatureRepository {
  save(
    input: UpdatePlanFeatureInput,
    manager?: EntityManager,
  ): Promise<PlanFeatureModel>;
}
