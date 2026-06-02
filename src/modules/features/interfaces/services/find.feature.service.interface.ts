import { EntityManager } from 'typeorm';
import { FeatureModel } from '../../domain/models/feature.model';

export interface FindFeatureService {
  findAll(manager?: EntityManager): Promise<FeatureModel[]>;
  findById(id: string, manager?: EntityManager): Promise<FeatureModel>;
  findByCode(code: string, manager?: EntityManager): Promise<FeatureModel>;
}
