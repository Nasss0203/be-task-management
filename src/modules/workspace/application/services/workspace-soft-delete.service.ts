import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import { BILLING_TYPES } from 'src/modules/billing/billing.types';
import type { SubscriptionLifecyclePort } from 'src/modules/billing/application/ports/subscription-lifecycle.port';
import type { WorkspaceRepository } from '../../domain/repositories/workspace.repository';
import { WORKSPACE_TYPES } from '../../workspace.types';

@Injectable()
export class WorkspaceSoftDeleteService {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepository: WorkspaceRepository,

    @Inject(BILLING_TYPES.services.SubscriptionLifecyclePort)
    private readonly subscriptionLifecycle: SubscriptionLifecyclePort,
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
    await this.subscriptionLifecycle.handleWorkspaceDeleted(
      workspaceId,
      context,
    );
  }
}
