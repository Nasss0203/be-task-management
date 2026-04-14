import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { WorkspaceInvite } from '../domain/entities/workspace_invite.entity';
import { WorkspaceInviteModel } from '../domain/models/workspace_invite.model';
import { FindWorkspaceInviteRepository } from '../interfaces/repositories/find-workspace-invite.repository.interface';
import { WorkspaceInviteMapper } from '../mapper/workspace_invites.mapper';

@Injectable()
export class FindWorkspaceInviteRepositoryImpl implements FindWorkspaceInviteRepository {
  constructor(
    @InjectRepository(WorkspaceInvite)
    private readonly repoWorkspaceInvite: Repository<WorkspaceInvite>,
  ) {}
  private getRepo(manager?: EntityManager): Repository<WorkspaceInvite> {
    return manager
      ? manager.getRepository(WorkspaceInvite)
      : this.repoWorkspaceInvite;
  }

  async findByToken(
    token: string,
    manager?: EntityManager,
  ): Promise<WorkspaceInviteModel | null> {
    const row = await this.getRepo(manager).findOne({
      where: { token },
    });

    if (!row) {
      return null;
    }

    return WorkspaceInviteMapper.toModel(row);
  }
}
