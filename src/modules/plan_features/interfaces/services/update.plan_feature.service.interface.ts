import { EntityManager } from 'typeorm';
import { PlanFeatureModel } from '../../domain/models/plan_feature.model';
import { UpdatePlanFeatureDto } from '../../dto/update-plan_feature.dto';

export interface UpdatePlanFeatureService {
  update(
    id: string,
    dto: UpdatePlanFeatureDto,
    manager?: EntityManager,
  ): Promise<PlanFeatureModel>;
}
