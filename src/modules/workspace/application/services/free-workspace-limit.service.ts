import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/common/constants/error-code.constant';
import type { WorkspaceEntitlementPort } from 'src/modules/billing/application/ports/workspace-entitlement.port';
import { BILLING_TYPES } from 'src/modules/billing/billing.types';
import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export const FREE_OWNED_WORKSPACE_LIMIT = 3;
export const FREE_WORKSPACE_LIMIT_FEATURE = 'MAX_FREE_WORKSPACES';

const FREE_PLAN_CODE = 'FREE';

@Injectable()
export class FreeWorkspaceLimitService {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepository: WorkspaceRepository,

    @Inject(BILLING_TYPES.services.WorkspaceEntitlementPort)
    private readonly entitlements: WorkspaceEntitlementPort,
  ) {}

  async assertCanCreate(
    userId: string,
    context: PersistenceContext,
  ): Promise<void> {
    await this.workspaceRepository.lockOwnership(userId, context);
    await this.assertBelowLimit(userId, context);
  }

  async assertCanRestore(
    userId: string,
    workspaceId: string,
    context: PersistenceContext,
  ): Promise<void> {
    await this.workspaceRepository.lockOwnership(userId, context);
    if (await this.isFree(workspaceId, context)) {
      await this.assertBelowLimit(userId, context);
    }
  }

  private async assertBelowLimit(
    userId: string,
    context: PersistenceContext,
  ): Promise<void> {
    const ownedIds = await this.workspaceRepository.findOwnedWorkspaceIds(
      userId,
      context,
    );

    let usage = 0;
    for (const workspaceId of ownedIds) {
      if (await this.isFree(workspaceId, context)) usage += 1;
    }

    if (usage < FREE_OWNED_WORKSPACE_LIMIT) return;

    throw new HttpException(
      {
        code: ErrorCode.WORKSPACE_LIMIT_EXCEEDED,
        message: 'Free workspace limit reached',
        details: {
          feature: FREE_WORKSPACE_LIMIT_FEATURE,
          limit: FREE_OWNED_WORKSPACE_LIMIT,
          usage,
        },
      },
      HttpStatus.FORBIDDEN,
    );
  }

  private async isFree(
    workspaceId: string,
    context: PersistenceContext,
  ): Promise<boolean> {
    const { plan } = await this.entitlements.getEntitlements(
      workspaceId,
      new Date(),
      context,
    );
    return plan.code === FREE_PLAN_CODE;
  }
}
