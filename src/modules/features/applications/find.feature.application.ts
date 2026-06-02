import { Inject, Injectable } from '@nestjs/common';
import { FeatureResponseDto } from '../dto/response/feature.response.dto';
import { FindFeatureApplication } from '../interfaces/applications/find.feature.application.interface';
import { type FindFeatureService } from '../interfaces/services/find.feature.service.interface';
import { FEATURE_TYPES } from '../interfaces/types';
import { FeatureMapper } from '../mapper/feature.mapper';

@Injectable()
export class FindFeatureApplicationImpl implements FindFeatureApplication {
  constructor(
    @Inject(FEATURE_TYPES.services.FindFeatureService)
    private readonly service: FindFeatureService,
  ) {}

  async findAll(): Promise<FeatureResponseDto[]> {
    const features = await this.service.findAll();

    return features.map((feature) => FeatureMapper.toResponse(feature));
  }

  async findById(id: string): Promise<FeatureResponseDto> {
    const feature = await this.service.findById(id);

    return FeatureMapper.toResponse(feature);
  }

  async findByCode(code: string): Promise<FeatureResponseDto> {
    const feature = await this.service.findByCode(code);

    return FeatureMapper.toResponse(feature);
  }
}
