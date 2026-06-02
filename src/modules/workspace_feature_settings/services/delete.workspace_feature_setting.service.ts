import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { type DeleteWorkspaceFeatureSettingRepository } from '../interfaces/repositories/delete.workspace_feature_setting.repository.interface';
import { DeleteWorkspaceFeatureSettingService } from '../interfaces/services/delete.workspace_feature_setting.service.interface';
import { type FindWorkspaceFeatureSettingService } from '../interfaces/services/find.workspace_feature_setting.service.interface';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';

@Injectable()
export class DeleteWorkspaceFeatureSettingServiceImpl
  implements DeleteWorkspaceFeatureSettingService
{
  constructor(
    @Inject(WORKSPACE_FEATURE_SETTING_TYPES.services.FindWorkspaceFeatureSettingService)
    private readonly findService: FindWorkspaceFeatureSettingService,

    @Inject(
      WORKSPACE_FEATURE_SETTING_TYPES.repositories
        .DeleteWorkspaceFeatureSettingRepository,
    )
    private readonly repo: DeleteWorkspaceFeatureSettingRepository,
  ) {}

  async delete(id: string, manager?: EntityManager): Promise<void> {
    await this.findService.findById(id, manager);
    await this.repo.softDelete(id, manager);
  }
}
