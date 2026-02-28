import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from '../domain/entities/workspace.entity';
import { WorkspaceModel } from '../domain/models/workspaces.model';
import { WorkspaceRepository } from '../interfaces/repositories/workspace.repository.interface';
import { WorkspaceMapper } from '../mapper/workspace.mapper';

@Injectable()
export class WorkspaceTypeOrmRepository implements WorkspaceRepository {
  constructor(
    @InjectRepository(Workspace)
    private readonly repo: Repository<Workspace>,
  ) {}

  async existsBySlug(slug: string): Promise<boolean> {
    return await this.repo.exists({ where: { slug } });
  }
  async save(workspace: WorkspaceModel): Promise<WorkspaceModel> {
    const entity = WorkspaceMapper.toEntity(workspace);
    const saved = await this.repo.save(entity);
    return WorkspaceMapper.toModel(saved);
  }
}
