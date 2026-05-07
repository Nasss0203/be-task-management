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
import { type AcceptWorkspaceInviteRepository } from '../interfaces/repositories/accept-workspace-invite.repository.interface';
import { type FindWorkspaceInviteRepository } from '../interfaces/repositories/find-workspace-invite.repository.interface';
import {
  AcceptWorkspaceInviteInput,
  AcceptWorkspaceInviteService,
} from '../interfaces/services/accept-workspace-invite.service.interface';
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
    input: AcceptWorkspaceInviteInput,
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

    if (invite.max_uses && invite.used_count >= invite.max_uses) {
      throw new BadRequestException('Workspace invite usage limit reached');
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

    return this.acceptWorkspaceInviteRepository.acceptWorkspaceInvite(
      {
        token,
        userId: input.userId,
      },
      manager,
    );
  }
}
