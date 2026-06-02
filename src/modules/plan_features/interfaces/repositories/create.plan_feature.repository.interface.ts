import { EntityManager } from 'typeorm';
import { PlanFeatureModel } from '../../domain/models/plan_feature.model';

export type SavePlanFeatureInput = {
  id?: string;
  planId: string;
  featureId: string;
  enabled?: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
};

export interface CreatePlanFeatureRepository {
  save(
    input: SavePlanFeatureInput,
    manager?: EntityManager,
  ): Promise<PlanFeatureModel>;
}
