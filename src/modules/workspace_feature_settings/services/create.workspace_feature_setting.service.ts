import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { WorkspaceFeatureSettingModel } from '../domain/models/workspace_feature_setting.model';
import { CreateWorkspaceFeatureSettingDto } from '../dto/create-workspace_feature_setting.dto';
import { type CreateWorkspaceFeatureSettingRepository } from '../interfaces/repositories/create.workspace_feature_setting.repository.interface';
import { CreateWorkspaceFeatureSettingService } from '../interfaces/services/create.workspace_feature_setting.service.interface';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';

@Injectable()
export class CreateWorkspaceFeatureSettingServiceImpl
  implements CreateWorkspaceFeatureSettingService
{
  constructor(
    @Inject(
      WORKSPACE_FEATURE_SETTING_TYPES.repositories
        .CreateWorkspaceFeatureSettingRepository,
    )
    private readonly repo: CreateWorkspaceFeatureSettingRepository,
  ) {}

  create(
    dto: CreateWorkspaceFeatureSettingDto,
    manager?: EntityManager,
  ): Promise<WorkspaceFeatureSettingModel> {
    return this.repo.save(
      {
        workspaceId: dto.workspaceId,
        featureId: dto.featureId,
        enabled: dto.enabled ?? false,
        createdBy: dto.createdBy ?? null,
        updatedBy: dto.updatedBy ?? null,
        metadata: dto.metadata ?? null,
      },
      manager,
    );
  }
}
