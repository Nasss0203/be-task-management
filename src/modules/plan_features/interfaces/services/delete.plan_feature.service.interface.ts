import { EntityManager } from 'typeorm';

export interface DeletePlanFeatureService {
  delete(id: string, manager?: EntityManager): Promise<void>;
}
