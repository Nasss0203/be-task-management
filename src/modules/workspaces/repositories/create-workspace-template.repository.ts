import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Workspace } from '../domain/entities/workspace.entity';
import { WorkspaceModel } from '../domain/models/workspaces.model';
import {
  CreateWorkspaceTemplateRepository,
  SaveWorkspaceTemplateInput,
} from '../interfaces/repositories/create-workspace-template.repository.interface';
import { WorkspaceMapper } from '../mapper/workspace.mapper';

@Injectable()
export class CreateWorkspaceTemplateRepositoryImpl implements CreateWorkspaceTemplateRepository {
  constructor(
    @InjectRepository(Workspace)
    private readonly repo: Repository<Workspace>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Workspace> {
    return manager ? manager.getRepository(Workspace) : this.repo;
  }

  async create(
    workspace: SaveWorkspaceTemplateInput,
    manager?: EntityManager,
  ): Promise<WorkspaceModel> {
    const repo = this.getRepo(manager);
    const entity = WorkspaceMapper.toEntity(workspace as WorkspaceModel);
    const saved = await repo.save(entity);
    return WorkspaceMapper.toModel(saved);
  }
}
