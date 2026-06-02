import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { WorkspaceFeatureSettingModel } from '../domain/models/workspace_feature_setting.model';
import { UpdateWorkspaceFeatureSettingDto } from '../dto/update-workspace_feature_setting.dto';
import { type UpdateWorkspaceFeatureSettingRepository } from '../interfaces/repositories/update.workspace_feature_setting.repository.interface';
import { type FindWorkspaceFeatureSettingService } from '../interfaces/services/find.workspace_feature_setting.service.interface';
import { UpdateWorkspaceFeatureSettingService } from '../interfaces/services/update.workspace_feature_setting.service.interface';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';

@Injectable()
export class UpdateWorkspaceFeatureSettingServiceImpl
  implements UpdateWorkspaceFeatureSettingService
{
  constructor(
    @Inject(WORKSPACE_FEATURE_SETTING_TYPES.services.FindWorkspaceFeatureSettingService)
    private readonly findService: FindWorkspaceFeatureSettingService,

    @Inject(
      WORKSPACE_FEATURE_SETTING_TYPES.repositories
        .UpdateWorkspaceFeatureSettingRepository,
    )
    private readonly repo: UpdateWorkspaceFeatureSettingRepository,
  ) {}

  async update(
    id: string,
    dto: UpdateWorkspaceFeatureSettingDto,
    manager?: EntityManager,
  ): Promise<WorkspaceFeatureSettingModel> {
    const current = await this.findService.findById(id, manager);

    return this.repo.save(
      {
        id: current.id,
        workspaceId: dto.workspaceId ?? current.workspaceId,
        featureId: dto.featureId ?? current.featureId,
        enabled: dto.enabled ?? current.enabled,
        createdBy:
          dto.createdBy !== undefined ? dto.createdBy : current.createdBy,
        updatedBy:
          dto.updatedBy !== undefined ? dto.updatedBy : current.updatedBy,
        metadata:
          dto.metadata !== undefined ? dto.metadata : current.metadata,
        createdAt: current.createdAt,
        updatedAt: current.updatedAt,
        deletedAt: current.deletedAt,
      },
      manager,
    );
  }
}
