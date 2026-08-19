import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { WorkspaceResponseDto } from 'src/modules/workspace/application/dto/workspace/response/workspaces.response.dto';
import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { RestoreWorkspaceCommand } from './restore-workspace.command';

@Injectable()
export class RestoreWorkspaceHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepository: WorkspaceRepository,
  ) {}

  async execute(
    command: RestoreWorkspaceCommand,
  ): Promise<WorkspaceResponseDto> {
    const workspace =
      await this.workspaceRepository.findDeletedByUserIdAndWorkspaceId(
        command.userId,
        command.workspaceId,
      );

    if (!workspace) {
      throw new HttpException(
        'Deleted workspace not found',
        HttpStatus.NOT_FOUND,
      );
    }

    workspace.restore();

    const restoredWorkspace = await this.workspaceRepository.save(workspace);

    return WorkspaceResponseDto.fromDomain(restoredWorkspace);
  }
}
