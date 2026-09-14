import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { BILLING_TYPES } from '../../billing.types';
import { WorkspaceSubscription } from '../../domain/entities/workspace-subscription.entity';
import type { BillingPlanRepository } from '../../domain/repositories/billing-plan.repository';
import type { WorkspaceSubscriptionRepository } from '../../domain/repositories/workspace-subscription.repository';

const FREE_PLAN_CODE = 'FREE';

@Injectable()
export class WorkspaceSubscriptionProvisioningService {
  constructor(
    @Inject(BILLING_TYPES.repositories.BillingPlanRepository)
    private readonly billingPlanRepository: BillingPlanRepository,

    @Inject(BILLING_TYPES.repositories.WorkspaceSubscriptionRepository)
    private readonly workspaceSubscriptionRepository: WorkspaceSubscriptionRepository,
  ) {}

  async getOrCreateInitialFree(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceSubscription> {
    const existingSubscription =
      await this.workspaceSubscriptionRepository.findByWorkspaceId(
        workspaceId,
        context,
      );

    if (existingSubscription) {
      return existingSubscription;
    }

    const freePlan = await this.billingPlanRepository.findByCode(
      FREE_PLAN_CODE,
      context,
    );

    if (!freePlan) {
      throw new InternalServerErrorException(
        'FREE billing plan is not configured',
      );
    }

    const subscription = WorkspaceSubscription.createInitialFree({
      workspaceId,
      planId: freePlan.getId(),
    });

    return this.workspaceSubscriptionRepository.save(subscription, context);
  }
}
