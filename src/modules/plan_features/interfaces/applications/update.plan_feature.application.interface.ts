import { PlanFeatureResponseDto } from '../../dto/response/plan_feature.response.dto';
import { UpdatePlanFeatureDto } from '../../dto/update-plan_feature.dto';

export interface UpdatePlanFeatureApplication {
  update(id: string, dto: UpdatePlanFeatureDto): Promise<PlanFeatureResponseDto>;
}
