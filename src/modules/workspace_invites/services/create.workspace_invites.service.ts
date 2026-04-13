import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EntityManager } from 'typeorm';
import { WorkspaceInviteStatus } from '../domain/entities/workspace_invite.entity';
import { WorkspaceInviteModel } from '../domain/models/workspace_invite.model';
import {
  SaveWorkspaceInviteInput,
  type CreateWorkspaceInviteRepository,
} from '../interfaces/repositories/create-workspace_invite.repository.interface';
import { CreateWorkspaceInviteService } from '../interfaces/services/create-workspace_invite.service.interface';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';

@Injectable()
export class CreateWorkspaceInviteServiceImpl implements CreateWorkspaceInviteService {
  constructor(
    @Inject(WORKSPACE_INVITE_TYPES.repositories.CreateWorkspaceInviteRepository)
    private readonly createWorkspaceInviteRepository: CreateWorkspaceInviteRepository,
  ) {}

  async save(
    input: SaveWorkspaceInviteInput,
    manager?: EntityManager,
  ): Promise<WorkspaceInviteModel> {
    if (!input.workspace_id) {
      throw new Error('workspace_id is required');
    }

    if (!input.invited_by) {
      throw new Error('invited_by is required');
    }

    if (!input.email || !input.email.trim()) {
      throw new Error('email is required');
    }

    const now = new Date();

    const inviteInput: SaveWorkspaceInviteInput = {
      ...input,
      email: input.email.trim().toLowerCase(),
      token: input.token ?? randomUUID(),
      status: input.status ?? WorkspaceInviteStatus.PENDING,
      expires_at:
        input.expires_at ?? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    };

    return this.createWorkspaceInviteRepository.save(inviteInput, manager);
  }
}
