import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  WorkspaceInvite,
  WorkspaceInviteStatus,
} from '../domain/entities/workspace_invite.entity';
import { WorkspaceInviteModel } from '../domain/models/workspace_invite.model';
import {
  AcceptWorkspaceInviteInput,
  AcceptWorkspaceInviteRepository,
} from '../interfaces/repositories/accept-workspace-invite.repository.interface';
import { WorkspaceInviteMapper } from '../mapper/workspace_invites.mapper';

@Injectable()
export class AcceptWorkspaceInviteRepositoryImpl implements AcceptWorkspaceInviteRepository {
  constructor(
    @InjectRepository(WorkspaceInvite)
    private readonly repoWorkspaceInvite: Repository<WorkspaceInvite>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<WorkspaceInvite> {
    return manager
      ? manager.getRepository(WorkspaceInvite)
      : this.repoWorkspaceInvite;
  }

  async acceptWorkspaceInvite(
    input: AcceptWorkspaceInviteInput,
    manager?: EntityManager,
  ): Promise<WorkspaceInviteModel> {
    const repo = this.getRepo(manager);

    const invite = await repo.findOne({
      where: { token: input.token },
    });

    if (!invite) {
      throw new NotFoundException('Workspace invite not found');
    }

    invite.user_id = input.userId;
    invite.status = WorkspaceInviteStatus.ACCEPTED;
    invite.accepted_at = new Date();
    invite.used_count = invite.used_count + 1;

    const saved = await repo.save(invite);

    return WorkspaceInviteMapper.toModel(saved);
  }
}
