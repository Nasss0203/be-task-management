import { Inject, Injectable } from '@nestjs/common';
import { CreateFeatureDto } from '../dto/create-feature.dto';
import { FeatureResponseDto } from '../dto/response/feature.response.dto';
import { CreateFeatureApplication } from '../interfaces/applications/create.feature.application.interface';
import { type CreateFeatureService } from '../interfaces/services/create.feature.service.interface';
import { FEATURE_TYPES } from '../interfaces/types';
import { FeatureMapper } from '../mapper/feature.mapper';

@Injectable()
export class CreateFeatureApplicationImpl implements CreateFeatureApplication {
  constructor(
    @Inject(FEATURE_TYPES.services.CreateFeatureService)
    private readonly service: CreateFeatureService,
  ) {}

  async create(dto: CreateFeatureDto): Promise<FeatureResponseDto> {
    const model = await this.service.create(dto);

    return FeatureMapper.toResponse(model);
  }
}
