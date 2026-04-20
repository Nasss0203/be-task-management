import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { WorkspaceInviteModel } from '../domain/models/workspace_invite.model';
import { type FindWorkspaceInviteRepository } from '../interfaces/repositories/find-workspace-invite.repository.interface';
import { FindWorkspaceInviteService } from '../interfaces/services/find-workspace-invite.service.interface';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';

@Injectable()
export class FindWorkspaceInviteServiceImpl implements FindWorkspaceInviteService {
  constructor(
    @Inject(WORKSPACE_INVITE_TYPES.repositories.FindWorkspaceInviteRepository)
    private readonly findWorkspaceInviteRepository: FindWorkspaceInviteRepository,
  ) {}

  async findByToken(
    token: string,
    manager?: EntityManager,
  ): Promise<WorkspaceInviteModel | null> {
    return this.findWorkspaceInviteRepository.findByToken(token, manager);
  }
}
