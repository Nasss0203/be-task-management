import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { WorkspaceInviteStatus } from '../domain/entities/workspace_invite.entity';
import { WorkspaceInviteModel } from '../domain/models/workspace_invite.model';
import { type AcceptWorkspaceInviteRepository } from '../interfaces/repositories/accept-workspace-invite.repository.interface';
import { type FindWorkspaceInviteRepository } from '../interfaces/repositories/find-workspace-invite.repository.interface';
import { AcceptWorkspaceInviteService } from '../interfaces/services/accept-workspace-invite.service.interface';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';

@Injectable()
export class AcceptWorkspaceInviteServiceImpl implements AcceptWorkspaceInviteService {
  constructor(
    @Inject(WORKSPACE_INVITE_TYPES.repositories.AcceptWorkspaceInviteRepository)
    private readonly acceptWorkspaceInviteRepository: AcceptWorkspaceInviteRepository,

    @Inject(WORKSPACE_INVITE_TYPES.repositories.FindWorkspaceInviteRepository)
    private readonly findWorkspaceInviteRepository: FindWorkspaceInviteRepository,
  ) {}

  async acceptWorkspaceInvite(
    token: string,
    manager?: EntityManager,
  ): Promise<WorkspaceInviteModel> {
    if (!token || !token.trim()) {
      throw new BadRequestException('token is required');
    }

    const invite = await this.findWorkspaceInviteRepository.findByToken(
      token,
      manager,
    );

    if (!invite) {
      throw new NotFoundException('Workspace invite not found');
    }

    if (invite.status !== WorkspaceInviteStatus.PENDING) {
      throw new BadRequestException('Workspace invite is no longer valid');
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      throw new BadRequestException('Workspace invite has expired');
    }

    return this.acceptWorkspaceInviteRepository.acceptWorkspaceInvite(
      token,
      manager,
    );
  }
}
