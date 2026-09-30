import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import type { WorkspaceRepository } from '../../domain/repositories/workspace.repository';
import { WORKSPACE_TYPES } from '../../workspace.types';

@Injectable()
export class WorkspaceSoftDeleteService {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepository: WorkspaceRepository,
  ) {}

  async execute(
    userId: string,
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<void> {
    const workspace = await this.workspaceRepository.findByUserIdAndWorkspaceId(
      userId,
      workspaceId,
      context,
    );

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    workspace.softDelete(userId, new Date());

    await this.workspaceRepository.save(workspace, context);
  }
}
