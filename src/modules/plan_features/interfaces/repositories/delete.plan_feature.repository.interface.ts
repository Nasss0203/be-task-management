import { EntityManager } from 'typeorm';

export interface DeletePlanFeatureRepository {
  softDelete(id: string, manager?: EntityManager): Promise<void>;
}
