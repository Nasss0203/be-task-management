import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { WorkspaceOverviewResponseDto } from 'src/modules/workspace/application/dto/workspace/response/workspace-overview.response.dto';
import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { GetWorkspaceOverviewQuery } from './get-workspace-overview.query';

@Injectable()
export class GetWorkspaceOverviewHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepository: WorkspaceRepository,
  ) {}

  async execute(
    query: GetWorkspaceOverviewQuery,
  ): Promise<WorkspaceOverviewResponseDto> {
    const workspace = await this.workspaceRepository.findByUserIdAndWorkspaceId(
      query.userId,
      query.workspaceId,
    );

    if (!workspace) {
      throw new HttpException('Workspace not found', HttpStatus.NOT_FOUND);
    }

    return this.workspaceRepository.findOverview(query.workspaceId);
  }
}
