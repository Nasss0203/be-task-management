import { FeatureResponseDto } from '../../dto/response/feature.response.dto';

export interface FindFeatureApplication {
  findAll(): Promise<FeatureResponseDto[]>;
  findById(id: string): Promise<FeatureResponseDto>;
  findByCode(code: string): Promise<FeatureResponseDto>;
}
