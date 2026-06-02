import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { WorkspaceFeatureSetting } from '../domain/entities/workspace_feature_setting.entity';
import { WorkspaceFeatureSettingModel } from '../domain/models/workspace_feature_setting.model';
import {
  UpdateWorkspaceFeatureSettingInput,
  UpdateWorkspaceFeatureSettingRepository,
} from '../interfaces/repositories/update.workspace_feature_setting.repository.interface';
import { WorkspaceFeatureSettingMapper } from '../mapper/workspace_feature_setting.mapper';

@Injectable()
export class UpdateWorkspaceFeatureSettingRepositoryImpl
  implements UpdateWorkspaceFeatureSettingRepository
{
  constructor(
    @InjectRepository(WorkspaceFeatureSetting)
    private readonly repo: Repository<WorkspaceFeatureSetting>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<WorkspaceFeatureSetting> {
    return manager ? manager.getRepository(WorkspaceFeatureSetting) : this.repo;
  }

  async save(
    input: UpdateWorkspaceFeatureSettingInput,
    manager?: EntityManager,
  ): Promise<WorkspaceFeatureSettingModel> {
    const saved = await this.getRepo(manager).save(
      WorkspaceFeatureSettingMapper.toEntity(input),
    );

    return WorkspaceFeatureSettingMapper.toModel(saved);
  }
}
