import { Inject, Injectable } from '@nestjs/common';
import { CreatePlanFeatureDto } from '../dto/create-plan_feature.dto';
import { PlanFeatureResponseDto } from '../dto/response/plan_feature.response.dto';
import { CreatePlanFeatureApplication } from '../interfaces/applications/create.plan_feature.application.interface';
import { type CreatePlanFeatureService } from '../interfaces/services/create.plan_feature.service.interface';
import { PLAN_FEATURE_TYPES } from '../interfaces/types';
import { PlanFeatureMapper } from '../mapper/plan_feature.mapper';

@Injectable()
export class CreatePlanFeatureApplicationImpl implements CreatePlanFeatureApplication {
  constructor(
    @Inject(PLAN_FEATURE_TYPES.services.CreatePlanFeatureService)
    private readonly service: CreatePlanFeatureService,
  ) {}

  async create(dto: CreatePlanFeatureDto): Promise<PlanFeatureResponseDto> {
    const model = await this.service.create(dto);

    return PlanFeatureMapper.toResponse(model);
  }
}
