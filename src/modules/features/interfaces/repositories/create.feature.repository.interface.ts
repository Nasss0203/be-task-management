import { EntityManager } from 'typeorm';
import { FeatureModel } from '../../domain/models/feature.model';

export type SaveFeatureInput = {
  id?: string;
  code: string;
  name: string;
  description?: string | null;
  category?: string | null;
  isActive?: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
};

export interface CreateFeatureRepository {
  save(input: SaveFeatureInput, manager?: EntityManager): Promise<FeatureModel>;
}
