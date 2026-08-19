import { Inject, Injectable } from '@nestjs/common';
import { WorkspaceResponseDto } from 'src/modules/workspace/application/dto/workspace/response/workspaces.response.dto';
import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { ListWorkspacesQuery } from './list-workspaces.query';

@Injectable()
export class ListWorkspacesHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepository: WorkspaceRepository,
  ) {}

  async execute(query: ListWorkspacesQuery): Promise<WorkspaceResponseDto[]> {
    const workspaces = await this.workspaceRepository.findByUserId(
      query.userId,
    );

    return workspaces.map((workspace) =>
      WorkspaceResponseDto.fromDomain(workspace),
    );
  }
}
