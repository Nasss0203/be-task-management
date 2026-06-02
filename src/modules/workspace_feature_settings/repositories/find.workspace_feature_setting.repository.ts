import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { WorkspaceFeatureSetting } from '../domain/entities/workspace_feature_setting.entity';
import { WorkspaceFeatureSettingModel } from '../domain/models/workspace_feature_setting.model';
import { FindWorkspaceFeatureSettingRepository } from '../interfaces/repositories/find.workspace_feature_setting.repository.interface';
import { WorkspaceFeatureSettingMapper } from '../mapper/workspace_feature_setting.mapper';

@Injectable()
export class FindWorkspaceFeatureSettingRepositoryImpl
  implements FindWorkspaceFeatureSettingRepository
{
  constructor(
    @InjectRepository(WorkspaceFeatureSetting)
    private readonly repo: Repository<WorkspaceFeatureSetting>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<WorkspaceFeatureSetting> {
    return manager ? manager.getRepository(WorkspaceFeatureSetting) : this.repo;
  }

  async findAll(
    manager?: EntityManager,
  ): Promise<WorkspaceFeatureSettingModel[]> {
    const entities = await this.getRepo(manager).find({
      order: {
        createdAt: 'ASC',
      },
    });

    return entities.map((entity) =>
      WorkspaceFeatureSettingMapper.toModel(entity),
    );
  }

  async findById(
    id: string,
    manager?: EntityManager,
  ): Promise<WorkspaceFeatureSettingModel | null> {
    const entity = await this.getRepo(manager).findOne({
      where: { id },
    });

    return entity ? WorkspaceFeatureSettingMapper.toModel(entity) : null;
  }

  async findByWorkspaceAndFeature(
    workspaceId: string,
    featureId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceFeatureSettingModel | null> {
    const entity = await this.getRepo(manager).findOne({
      where: { workspaceId, featureId },
    });

    return entity ? WorkspaceFeatureSettingMapper.toModel(entity) : null;
  }
}
