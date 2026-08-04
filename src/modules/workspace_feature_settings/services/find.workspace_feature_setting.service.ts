import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { WorkspaceFeatureSettingModel } from '../domain/models/workspace_feature_setting.model';
import { type FindWorkspaceFeatureSettingRepository } from '../interfaces/repositories/find.workspace_feature_setting.repository.interface';
import { FindWorkspaceFeatureSettingService } from '../interfaces/services/find.workspace_feature_setting.service.interface';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';

@Injectable()
export class FindWorkspaceFeatureSettingServiceImpl implements FindWorkspaceFeatureSettingService {
  constructor(
    @Inject(
      WORKSPACE_FEATURE_SETTING_TYPES.repositories
        .FindWorkspaceFeatureSettingRepository,
    )
    private readonly repo: FindWorkspaceFeatureSettingRepository,
  ) {}

  findAll(manager?: EntityManager): Promise<WorkspaceFeatureSettingModel[]> {
    return this.repo.findAll(manager);
  }

  async findById(
    id: string,
    manager?: EntityManager,
  ): Promise<WorkspaceFeatureSettingModel> {
    const setting = await this.repo.findById(id, manager);

    if (!setting) {
      throw new NotFoundException('Workspace feature setting not found');
    }

    return setting;
  }

  async findByWorkspaceAndFeature(
    workspaceId: string,
    featureId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceFeatureSettingModel> {
    const setting = await this.repo.findByWorkspaceAndFeature(
      workspaceId,
      featureId,
      manager,
    );

    if (!setting) {
      throw new NotFoundException('Workspace feature setting not found');
    }

    return setting;
  }
}
