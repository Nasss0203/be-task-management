import { Inject, Injectable } from '@nestjs/common';
import { PlanFeatureResponseDto } from '../dto/response/plan_feature.response.dto';
import { UpdatePlanFeatureDto } from '../dto/update-plan_feature.dto';
import { UpdatePlanFeatureApplication } from '../interfaces/applications/update.plan_feature.application.interface';
import { type UpdatePlanFeatureService } from '../interfaces/services/update.plan_feature.service.interface';
import { PLAN_FEATURE_TYPES } from '../interfaces/types';
import { PlanFeatureMapper } from '../mapper/plan_feature.mapper';

@Injectable()
export class UpdatePlanFeatureApplicationImpl implements UpdatePlanFeatureApplication {
  constructor(
    @Inject(PLAN_FEATURE_TYPES.services.UpdatePlanFeatureService)
    private readonly service: UpdatePlanFeatureService,
  ) {}

  async update(
    id: string,
    dto: UpdatePlanFeatureDto,
  ): Promise<PlanFeatureResponseDto> {
    const planFeature = await this.service.update(id, dto);

    return PlanFeatureMapper.toResponse(planFeature);
  }
}
