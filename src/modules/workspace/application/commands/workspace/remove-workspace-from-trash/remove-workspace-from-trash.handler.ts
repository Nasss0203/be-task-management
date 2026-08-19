import { Inject, Injectable } from '@nestjs/common';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { RemoveWorkspaceFromTrashCommand } from './remove-workspace-from-trash.command';

@Injectable()
export class RemoveWorkspaceFromTrashHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,
  ) {}

  async execute(command: RemoveWorkspaceFromTrashCommand): Promise<void> {
    await this.workspaceMemberRepository.deleteByWorkspaceAndUserIfWorkspaceDeleted(
      command.workspaceId,
      command.userId,
    );
  }
}
