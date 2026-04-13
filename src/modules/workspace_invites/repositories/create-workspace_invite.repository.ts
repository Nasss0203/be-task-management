import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { WorkspaceInvite } from '../domain/entities/workspace_invite.entity';
import { WorkspaceInviteModel } from '../domain/models/workspace_invite.model';
import {
  CreateWorkspaceInviteRepository,
  SaveWorkspaceInviteInput,
} from '../interfaces/repositories/create-workspace_invite.repository.interface';
import { WorkspaceInviteMapper } from '../mapper/workspace_invites.mapper';

@Injectable()
export class CreateWorkspaceInviteRepositoryImpl implements CreateWorkspaceInviteRepository {
  constructor(
    @InjectRepository(WorkspaceInvite)
    private readonly repoWorkspaceInvite: Repository<WorkspaceInvite>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<WorkspaceInvite> {
    return manager
      ? manager.getRepository(WorkspaceInvite)
      : this.repoWorkspaceInvite;
  }
  async save(
    input: SaveWorkspaceInviteInput,
    manager?: EntityManager,
  ): Promise<WorkspaceInviteModel> {
    const repo = this.getRepo(manager);

    const entity = WorkspaceInviteMapper.toEntity(input);

    const saved = await repo.save(entity);

    return WorkspaceInviteMapper.toModel(saved);
  }
}
