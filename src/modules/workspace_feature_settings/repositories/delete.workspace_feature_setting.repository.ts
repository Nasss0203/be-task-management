import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { WorkspaceFeatureSetting } from '../domain/entities/workspace_feature_setting.entity';
import { DeleteWorkspaceFeatureSettingRepository } from '../interfaces/repositories/delete.workspace_feature_setting.repository.interface';

@Injectable()
export class DeleteWorkspaceFeatureSettingRepositoryImpl
  implements DeleteWorkspaceFeatureSettingRepository
{
  constructor(
    @InjectRepository(WorkspaceFeatureSetting)
    private readonly repo: Repository<WorkspaceFeatureSetting>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<WorkspaceFeatureSetting> {
    return manager ? manager.getRepository(WorkspaceFeatureSetting) : this.repo;
  }

  async softDelete(id: string, manager?: EntityManager): Promise<void> {
    await this.getRepo(manager).softDelete(id);
  }
}
