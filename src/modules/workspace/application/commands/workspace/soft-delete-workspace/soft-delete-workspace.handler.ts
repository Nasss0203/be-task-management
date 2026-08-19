import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { WorkspaceResponseDto } from 'src/modules/workspace/application/dto/workspace/response/workspaces.response.dto';
import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { SoftDeleteWorkspaceCommand } from './soft-delete-workspace.command';

@Injectable()
export class SoftDeleteWorkspaceHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepository: WorkspaceRepository,
  ) {}

  async execute(
    command: SoftDeleteWorkspaceCommand,
  ): Promise<WorkspaceResponseDto> {
    const workspace = await this.workspaceRepository.findByUserIdAndWorkspaceId(
      command.userId,
      command.workspaceId,
    );

    if (!workspace) {
      throw new HttpException('Workspace not found', HttpStatus.NOT_FOUND);
    }

    workspace.softDelete(command.userId, new Date());

    const deletedWorkspace = await this.workspaceRepository.save(workspace);

    return WorkspaceResponseDto.fromDomain(deletedWorkspace);
  }
}
