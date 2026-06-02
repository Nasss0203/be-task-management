import { EntityManager } from 'typeorm';
import { PlanFeatureModel } from '../../domain/models/plan_feature.model';

export interface FindPlanFeatureService {
  findAll(manager?: EntityManager): Promise<PlanFeatureModel[]>;
  findById(id: string, manager?: EntityManager): Promise<PlanFeatureModel>;
}
