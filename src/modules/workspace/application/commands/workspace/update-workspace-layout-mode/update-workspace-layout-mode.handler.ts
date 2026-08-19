import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { WorkspaceResponseDto } from 'src/modules/workspace/application/dto/workspace/response/workspaces.response.dto';
import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { UpdateWorkspaceLayoutModeCommand } from './update-workspace-layout-mode.command';

@Injectable()
export class UpdateWorkspaceLayoutModeHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepository: WorkspaceRepository,
  ) {}

  async execute(
    command: UpdateWorkspaceLayoutModeCommand,
  ): Promise<WorkspaceResponseDto> {
    const workspace = await this.workspaceRepository.findByUserIdAndWorkspaceId(
      command.userId,
      command.workspaceId,
    );

    if (!workspace) {
      throw new HttpException('Workspace not found', HttpStatus.NOT_FOUND);
    }

    workspace.changeLayoutMode(command.dto.layoutMode);

    const updated = await this.workspaceRepository.save(workspace);

    return WorkspaceResponseDto.fromDomain(updated);
  }
}
