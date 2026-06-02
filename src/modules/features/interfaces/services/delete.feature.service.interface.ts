import { EntityManager } from 'typeorm';

export interface DeleteFeatureService {
  delete(id: string, manager?: EntityManager): Promise<void>;
}
