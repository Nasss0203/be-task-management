import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserWorkspace } from '../domain/entities/user_workspace.entity';
import { UserWorkspaceModel } from '../domain/models/user_workspace.model';
import {
  type SaveUserWorkspaceInput,
  UserWorkspaceRepository,
} from '../interfaces/repositories/user_workspace.repository.interface';
import { WorkspaceMemeberMapper } from '../mapper/user_workspace.mapper';

@Injectable()
export class UserWorkspaceRepositoryImpl implements UserWorkspaceRepository {
  constructor(
    @InjectRepository(UserWorkspace)
    private readonly repo: Repository<UserWorkspace>,
  ) {}

  private resolveRepo(manager?: EntityManager): Repository<UserWorkspace> {
    return manager ? manager.getRepository(UserWorkspace) : this.repo;
  }

  async create(
    input: SaveUserWorkspaceInput,
    manager?: EntityManager,
  ): Promise<UserWorkspaceModel> {
    const repo = this.resolveRepo(manager);
    const entity = WorkspaceMemeberMapper.toEntity(input);
    const saved = await repo.save(entity);

    return WorkspaceMemeberMapper.toModel(saved);
  }
}
