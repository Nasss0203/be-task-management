import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { BILLING_TYPES } from '../../../../billing.types';
import type { BillingPlanPriceRepository } from '../../../../domain/repositories/billing-plan-price.repository';
import type { WorkspaceSubscriptionRepository } from '../../../../domain/repositories/workspace-subscription.repository';
import { CheckoutQuoteResponseDto } from '../../../dto/response/checkout-quote.response.dto';
import { PlanChangeQuoteService } from '../../../services/plan-change-quote.service';
import { GetCheckoutQuoteQuery } from './get-checkout-quote.query';

@Injectable()
export class GetCheckoutQuoteHandler {
  constructor(
    @Inject(BILLING_TYPES.repositories.BillingPlanPriceRepository)
    private readonly billingPlanPriceRepository: BillingPlanPriceRepository,

    @Inject(BILLING_TYPES.repositories.WorkspaceSubscriptionRepository)
    private readonly workspaceSubscriptionRepository: WorkspaceSubscriptionRepository,

    @Inject(BILLING_TYPES.services.PlanChangeQuoteService)
    private readonly planChangeQuoteService: PlanChangeQuoteService,
  ) {}

  async execute(
    query: GetCheckoutQuoteQuery,
  ): Promise<CheckoutQuoteResponseDto> {
    const planPrice = await this.billingPlanPriceRepository.findActiveById(
      query.planPriceId,
    );

    if (!planPrice) {
      throw new NotFoundException('Billing plan price not found or inactive');
    }

    const subscription =
      await this.workspaceSubscriptionRepository.findByWorkspaceId(
        query.workspaceId,
      );
    const quote = await this.planChangeQuoteService.quote(
      subscription,
      planPrice,
      new Date(),
    );

    return {
      planPriceId: planPrice.getId(),
      listAmount: quote.listAmount,
      creditAmount: quote.creditAmount,
      amount: quote.amount,
      currency: planPrice.getCurrency(),
      blocked: quote.blocked,
    };
  }
}
