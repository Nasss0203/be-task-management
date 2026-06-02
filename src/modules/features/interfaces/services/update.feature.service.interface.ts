import { EntityManager } from 'typeorm';
import { FeatureModel } from '../../domain/models/feature.model';
import { UpdateFeatureDto } from '../../dto/update-feature.dto';

export interface UpdateFeatureService {
  update(
    id: string,
    dto: UpdateFeatureDto,
    manager?: EntityManager,
  ): Promise<FeatureModel>;
}
