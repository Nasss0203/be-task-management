import { Inject, Injectable } from '@nestjs/common';
import { DeleteFeatureApplication } from '../interfaces/applications/delete.feature.application.interface';
import { type DeleteFeatureService } from '../interfaces/services/delete.feature.service.interface';
import { FEATURE_TYPES } from '../interfaces/types';

@Injectable()
export class DeleteFeatureApplicationImpl implements DeleteFeatureApplication {
  constructor(
    @Inject(FEATURE_TYPES.services.DeleteFeatureService)
    private readonly service: DeleteFeatureService,
  ) {}

  delete(id: string): Promise<void> {
    return this.service.delete(id);
  }
}
