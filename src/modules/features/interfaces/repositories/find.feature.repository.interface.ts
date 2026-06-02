import { EntityManager } from 'typeorm';
import { FeatureModel } from '../../domain/models/feature.model';

export interface FindFeatureRepository {
  findAll(manager?: EntityManager): Promise<FeatureModel[]>;
  findById(id: string, manager?: EntityManager): Promise<FeatureModel | null>;
  findByCode(
    code: string,
    manager?: EntityManager,
  ): Promise<FeatureModel | null>;
}
