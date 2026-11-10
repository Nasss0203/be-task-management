import { Inject, Injectable } from '@nestjs/common';

import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { BILLING_TYPES } from '../../billing.types';
import type { WorkspaceSubscription } from '../../domain/entities/workspace-subscription.entity';
import type { WorkspaceSubscriptionRepository } from '../../domain/repositories/workspace-subscription.repository';
import type { SubscriptionLifecyclePort } from '../ports/subscription-lifecycle.port';

@Injectable()
export class BillingSubscriptionLifecycleService implements SubscriptionLifecyclePort {
  constructor(
    @Inject(BILLING_TYPES.repositories.WorkspaceSubscriptionRepository)
    private readonly subscriptionRepository: WorkspaceSubscriptionRepository,
  ) {}

  async handleBillingContactLeft(
    workspaceId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<void> {
    await this.scheduleCancellation(
      workspaceId,
      (subscription) => subscription.getBillingContactUserId() === userId,
      context,
    );
  }

  async handleWorkspaceDeleted(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<void> {
    await this.scheduleCancellation(workspaceId, () => true, context);
  }

  private async scheduleCancellation(
    workspaceId: string,
    applies: (subscription: WorkspaceSubscription) => boolean,
    context?: PersistenceContext,
  ): Promise<void> {
    const found = await this.subscriptionRepository.findByWorkspaceId(
      workspaceId,
      context,
    );
    const subscription =
      found && context
        ? await this.subscriptionRepository.findByIdForUpdate(
            found.getId(),
            context,
          )
        : found;

    if (
      !subscription ||
      !subscription.isPaid() ||
      subscription.getCancelAtPeriodEnd() ||
      !applies(subscription)
    ) {
      return;
    }

    subscription.scheduleCancellation();
    await this.subscriptionRepository.save(subscription, context);
  }
}
