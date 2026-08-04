import { EntityManager } from 'typeorm';
import { FeatureModel } from '../../domain/models/feature.model';
import { CreateFeatureDto } from '../../dto/create-feature.dto';

export interface CreateFeatureService {
  create(dto: CreateFeatureDto, manager?: EntityManager): Promise<FeatureModel>;
}
