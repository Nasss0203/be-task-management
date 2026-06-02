import { EntityManager } from 'typeorm';

export interface DeleteFeatureRepository {
  softDelete(id: string, manager?: EntityManager): Promise<void>;
}
