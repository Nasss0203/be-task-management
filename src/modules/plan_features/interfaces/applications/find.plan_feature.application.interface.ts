import { PlanFeatureResponseDto } from '../../dto/response/plan_feature.response.dto';

export interface FindPlanFeatureApplication {
  findAll(): Promise<PlanFeatureResponseDto[]>;
  findById(id: string): Promise<PlanFeatureResponseDto>;
}
