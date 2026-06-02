import { EntityManager } from 'typeorm';
import { FeatureModel } from '../../domain/models/feature.model';
import { SaveFeatureInput } from './create.feature.repository.interface';

export type UpdateFeatureInput = Partial<SaveFeatureInput> & {
  id: string;
};

export interface UpdateFeatureRepository {
  save(
    input: UpdateFeatureInput,
    manager?: EntityManager,
  ): Promise<FeatureModel>;
}
