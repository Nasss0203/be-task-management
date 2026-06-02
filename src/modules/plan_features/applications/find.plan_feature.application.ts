import { Inject, Injectable } from '@nestjs/common';
import { PlanFeatureResponseDto } from '../dto/response/plan_feature.response.dto';
import { FindPlanFeatureApplication } from '../interfaces/applications/find.plan_feature.application.interface';
import { type FindPlanFeatureService } from '../interfaces/services/find.plan_feature.service.interface';
import { PLAN_FEATURE_TYPES } from '../interfaces/types';
import { PlanFeatureMapper } from '../mapper/plan_feature.mapper';

@Injectable()
export class FindPlanFeatureApplicationImpl
  implements FindPlanFeatureApplication
{
  constructor(
    @Inject(PLAN_FEATURE_TYPES.services.FindPlanFeatureService)
    private readonly service: FindPlanFeatureService,
  ) {}

  async findAll(): Promise<PlanFeatureResponseDto[]> {
    const planFeatures = await this.service.findAll();

    return planFeatures.map((item) => PlanFeatureMapper.toResponse(item));
  }

  async findById(id: string): Promise<PlanFeatureResponseDto> {
    const planFeature = await this.service.findById(id);

    return PlanFeatureMapper.toResponse(planFeature);
  }
}
