import { Inject, Injectable } from '@nestjs/common';
import { DeleteWorkspaceFeatureSettingApplication } from '../interfaces/applications/delete.workspace_feature_setting.application.interface';
import { type DeleteWorkspaceFeatureSettingService } from '../interfaces/services/delete.workspace_feature_setting.service.interface';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';

@Injectable()
export class DeleteWorkspaceFeatureSettingApplicationImpl implements DeleteWorkspaceFeatureSettingApplication {
  constructor(
    @Inject(
      WORKSPACE_FEATURE_SETTING_TYPES.services
        .DeleteWorkspaceFeatureSettingService,
    )
    private readonly service: DeleteWorkspaceFeatureSettingService,
  ) {}

  delete(id: string): Promise<void> {
    return this.service.delete(id);
  }
}
