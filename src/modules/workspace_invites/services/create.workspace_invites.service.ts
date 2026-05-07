import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EntityManager } from 'typeorm';
import {
  WorkspaceInviteStatus,
  WorkspaceInviteType,
} from '../domain/entities/workspace_invite.entity';
import { WorkspaceInviteModel } from '../domain/models/workspace_invite.model';
import {
  SaveWorkspaceInviteInput,
  type CreateWorkspaceInviteRepository,
} from '../interfaces/repositories/create-workspace_invite.repository.interface';
import {
  CreateWorkspaceInviteInput,
  CreateWorkspaceInviteService,
} from '../interfaces/services/create-workspace_invite.service.interface';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';

@Injectable()
export class CreateWorkspaceInviteServiceImpl implements CreateWorkspaceInviteService {
  constructor(
    @Inject(WORKSPACE_INVITE_TYPES.repositories.CreateWorkspaceInviteRepository)
    private readonly createWorkspaceInviteRepository: CreateWorkspaceInviteRepository,
  ) {}

  async save(
    input: CreateWorkspaceInviteInput,
    manager?: EntityManager,
  ): Promise<WorkspaceInviteModel> {
    if (!input.workspace_id) {
      throw new BadRequestException('workspace_id is required');
    }

    if (!input.invited_by) {
      throw new BadRequestException('invited_by is required');
    }

    if (!input.email || !input.email.trim()) {
      throw new BadRequestException('email is required');
    }

    if (!input.role_name) {
      throw new BadRequestException('role_name is required');
    }

    const now = new Date();

    const inviteInput: SaveWorkspaceInviteInput = {
      workspace_id: input.workspace_id,
      user_id: input.user_id ?? null,
      email: input.email.trim().toLowerCase(),
      type: WorkspaceInviteType.EMAIL,
      role_name: input.role_name,
      invited_by: input.invited_by,
      token: randomUUID(),
      status: WorkspaceInviteStatus.PENDING,
      expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      max_uses: 1,
      used_count: 0,
    };

    return this.createWorkspaceInviteRepository.save(inviteInput, manager);
  }
}
