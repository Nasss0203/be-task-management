import { Inject, Injectable } from '@nestjs/common';
import { DeletePlanFeatureApplication } from '../interfaces/applications/delete.plan_feature.application.interface';
import { type DeletePlanFeatureService } from '../interfaces/services/delete.plan_feature.service.interface';
import { PLAN_FEATURE_TYPES } from '../interfaces/types';

@Injectable()
export class DeletePlanFeatureApplicationImpl
  implements DeletePlanFeatureApplication
{
  constructor(
    @Inject(PLAN_FEATURE_TYPES.services.DeletePlanFeatureService)
    private readonly service: DeletePlanFeatureService,
  ) {}

  delete(id: string): Promise<void> {
    return this.service.delete(id);
  }
}
