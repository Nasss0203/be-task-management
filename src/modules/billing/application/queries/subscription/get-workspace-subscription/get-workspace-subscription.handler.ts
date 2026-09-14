import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { BILLING_TYPES } from '../../../../billing.types';
import type { BillingPlanRepository } from '../../../../domain/repositories/billing-plan.repository';
import type { WorkspaceSubscriptionRepository } from '../../../../domain/repositories/workspace-subscription.repository';
import { SubscriptionStatus } from '../../../../domain/constants/subscription-status.constant';
import { WorkspaceSubscriptionResponseDto } from '../../../dto/response/workspace-subscription.response.dto';
import { GetWorkspaceSubscriptionQuery } from './get-workspace-subscription.query';

const FREE_PLAN_CODE = 'FREE';

@Injectable()
export class GetWorkspaceSubscriptionHandler {
  constructor(
    @Inject(BILLING_TYPES.repositories.WorkspaceSubscriptionRepository)
    private readonly workspaceSubscriptionRepository: WorkspaceSubscriptionRepository,

    @Inject(BILLING_TYPES.repositories.BillingPlanRepository)
    private readonly billingPlanRepository: BillingPlanRepository,
  ) {}

  async execute(
    query: GetWorkspaceSubscriptionQuery,
  ): Promise<WorkspaceSubscriptionResponseDto> {
    const subscription =
      await this.workspaceSubscriptionRepository.findByWorkspaceId(
        query.workspaceId,
      );

    if (!subscription) {
      const freePlan =
        await this.billingPlanRepository.findByCode(FREE_PLAN_CODE);

      if (!freePlan) {
        throw new InternalServerErrorException(
          'FREE billing plan is not configured',
        );
      }

      return {
        subscriptionId: null,
        workspaceId: query.workspaceId,
        plan: {
          id: freePlan.getId(),
          code: freePlan.getCode(),
          name: freePlan.getName(),
        },
        planPriceId: null,
        provider: null,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    const plan = await this.billingPlanRepository.findById(
      subscription.getPlanId(),
    );

    if (!plan) {
      throw new InternalServerErrorException(
        'Workspace subscription billing plan is not configured',
      );
    }

    return {
      subscriptionId: subscription.getId(),
      workspaceId: subscription.getWorkspaceId(),
      plan: {
        id: plan.getId(),
        code: plan.getCode(),
        name: plan.getName(),
      },
      planPriceId: subscription.getPlanPriceId(),
      provider: subscription.getProvider(),
      status: subscription.getStatus(),
      currentPeriodStart: subscription.getCurrentPeriodStart(),
      currentPeriodEnd: subscription.getCurrentPeriodEnd(),
      cancelAtPeriodEnd: subscription.getCancelAtPeriodEnd(),
    };
  }
}
