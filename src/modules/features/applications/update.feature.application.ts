import { Inject, Injectable } from '@nestjs/common';
import { FeatureResponseDto } from '../dto/response/feature.response.dto';
import { UpdateFeatureDto } from '../dto/update-feature.dto';
import { UpdateFeatureApplication } from '../interfaces/applications/update.feature.application.interface';
import { type UpdateFeatureService } from '../interfaces/services/update.feature.service.interface';
import { FEATURE_TYPES } from '../interfaces/types';
import { FeatureMapper } from '../mapper/feature.mapper';

@Injectable()
export class UpdateFeatureApplicationImpl implements UpdateFeatureApplication {
  constructor(
    @Inject(FEATURE_TYPES.services.UpdateFeatureService)
    private readonly service: UpdateFeatureService,
  ) {}

  async update(
    id: string,
    dto: UpdateFeatureDto,
  ): Promise<FeatureResponseDto> {
    const feature = await this.service.update(id, dto);

    return FeatureMapper.toResponse(feature);
  }
}
