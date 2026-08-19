import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { WorkspaceAccessResponseDto } from 'src/modules/workspace/application/dto/workspace/response/workspaces.response.dto';
import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { GetWorkspaceAccessQuery } from './get-workspace-access.query';

@Injectable()
export class GetWorkspaceAccessHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepository: WorkspaceRepository,
  ) {}

  async execute(
    query: GetWorkspaceAccessQuery,
  ): Promise<WorkspaceAccessResponseDto> {
    const access = await this.workspaceRepository.findAccess(
      query.userId,
      query.workspaceId,
    );

    if (!access) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return {
      user_id: access.userId,
      workspace_id: access.workspaceId,
      roles: access.roles,
      permissions: access.permissions,
    };
  }
}
