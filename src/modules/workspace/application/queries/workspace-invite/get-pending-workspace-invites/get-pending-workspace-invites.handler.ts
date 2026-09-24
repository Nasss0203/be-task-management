import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { PendingWorkspaceInviteResponseDto } from 'src/modules/workspace/application/dto/workspace-invite/response/pending-workspace-invite.response.dto';
import type { WorkspaceInviteRepository } from 'src/modules/workspace/domain/repositories/workspace-invite.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';

import { GetPendingWorkspaceInvitesQuery } from './get-pending-workspace-invites.query';

@Injectable()
export class GetPendingWorkspaceInvitesHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceInviteRepository)
    private readonly workspaceInviteRepository: WorkspaceInviteRepository,
  ) {}

  async execute(
    query: GetPendingWorkspaceInvitesQuery,
  ): Promise<PendingWorkspaceInviteResponseDto[]> {
    if (!query.workspaceId?.trim()) {
      throw new BadRequestException('workspaceId is required');
    }

    const invites =
      await this.workspaceInviteRepository.findPendingByWorkspaceId(
        query.workspaceId,
      );

    return invites.map((invite) =>
      PendingWorkspaceInviteResponseDto.fromDomain(invite),
    );
  }
}
