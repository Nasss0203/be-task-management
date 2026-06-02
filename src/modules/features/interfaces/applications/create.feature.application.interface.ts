import { CreateFeatureDto } from '../../dto/create-feature.dto';
import { FeatureResponseDto } from '../../dto/response/feature.response.dto';

export interface CreateFeatureApplication {
  create(dto: CreateFeatureDto): Promise<FeatureResponseDto>;
}
