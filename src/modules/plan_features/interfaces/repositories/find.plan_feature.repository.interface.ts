import { EntityManager } from 'typeorm';
import { PlanFeatureModel } from '../../domain/models/plan_feature.model';

export interface FindPlanFeatureRepository {
  findAll(manager?: EntityManager): Promise<PlanFeatureModel[]>;
  findById(
    id: string,
    manager?: EntityManager,
  ): Promise<PlanFeatureModel | null>;
  findByPlanAndFeature(
    planId: string,
    featureId: string,
    manager?: EntityManager,
  ): Promise<PlanFeatureModel | null>;
}
