import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { UserProfilePreferenceService } from 'src/modules/identity/application/ports/user-profile-preference.service.interface';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { SelectWorkspaceCommand } from './select-workspace.command';

@Injectable()
export class SelectWorkspaceHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepository: WorkspaceRepository,

    @Inject(IDENTITY_TYPES.services.UserProfilePreferenceService)
    private readonly userProfilePreferenceService: UserProfilePreferenceService,
  ) {}

  async execute(command: SelectWorkspaceCommand): Promise<void> {
    const workspace = await this.workspaceRepository.findByUserIdAndWorkspaceId(
      command.userId,
      command.workspaceId,
    );

    if (!workspace) {
      throw new NotFoundException('Workspace not found or access denied');
    }

    await this.userProfilePreferenceService.updateLastActiveWorkspace(
      command.userId,
      workspace.getId(),
    );
  }
}
