import { CreatePlanFeatureDto } from '../../dto/create-plan_feature.dto';
import { PlanFeatureResponseDto } from '../../dto/response/plan_feature.response.dto';

export interface CreatePlanFeatureApplication {
  create(dto: CreatePlanFeatureDto): Promise<PlanFeatureResponseDto>;
}
