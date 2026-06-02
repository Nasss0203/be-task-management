import { FeatureResponseDto } from '../../dto/response/feature.response.dto';
import { UpdateFeatureDto } from '../../dto/update-feature.dto';

export interface UpdateFeatureApplication {
  update(id: string, dto: UpdateFeatureDto): Promise<FeatureResponseDto>;
}
