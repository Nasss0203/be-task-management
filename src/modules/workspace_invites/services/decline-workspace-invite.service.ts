import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  WorkspaceInviteStatus,
  WorkspaceInviteType,
} from '../domain/entities/workspace_invite.entity';
import { WorkspaceInviteModel } from '../domain/models/workspace_invite.model';
import { type DeclineWorkspaceInviteRepository } from '../interfaces/repositories/decline-workspace-invite.repository.interface';
import { type FindWorkspaceInviteRepository } from '../interfaces/repositories/find-workspace-invite.repository.interface';
import {
  DeclineWorkspaceInviteInput,
  DeclineWorkspaceInviteService,
} from '../interfaces/services/decline-workspace-invite.service.interface';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';

@Injectable()
export class DeclineWorkspaceInviteServiceImpl implements DeclineWorkspaceInviteService {
  constructor(
    @Inject(
      WORKSPACE_INVITE_TYPES.repositories.DeclineWorkspaceInviteRepository,
    )
    private readonly declineWorkspaceInviteRepository: DeclineWorkspaceInviteRepository,

    @Inject(WORKSPACE_INVITE_TYPES.repositories.FindWorkspaceInviteRepository)
    private readonly findWorkspaceInviteRepository: FindWorkspaceInviteRepository,
  ) {}

  async declineWorkspaceInvite(
    input: DeclineWorkspaceInviteInput,
    manager?: EntityManager,
  ): Promise<WorkspaceInviteModel> {
    const token = input.token?.trim();

    if (!token) {
      throw new BadRequestException('token is required');
    }

    if (!input.userId) {
      throw new BadRequestException('userId is required');
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

    if (invite.type === WorkspaceInviteType.EMAIL) {
      if (!input.email || !input.email.trim()) {
        throw new BadRequestException('email is required');
      }

      if (!invite.email) {
        throw new BadRequestException('Invite email is missing');
      }

      const inviteEmail = invite.email.trim().toLowerCase();
      const currentUserEmail = input.email.trim().toLowerCase();

      if (inviteEmail !== currentUserEmail) {
        throw new ForbiddenException('This invite is not for your email');
      }
    }

    return this.declineWorkspaceInviteRepository.declineWorkspaceInvite(
      {
        token,
      },
      manager,
    );
  }
}
