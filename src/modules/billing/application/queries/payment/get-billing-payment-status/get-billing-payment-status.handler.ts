import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { BILLING_TYPES } from '../../../../billing.types';
import type { PaymentOrderRepository } from '../../../../domain/repositories/payment-order.repository';
import { GetBillingPaymentStatusQuery } from './get-billing-payment-status.query';

@Injectable()
export class GetBillingPaymentStatusHandler {
  constructor(
    @Inject(BILLING_TYPES.repositories.PaymentOrderRepository)
    private readonly paymentOrderRepository: PaymentOrderRepository,
  ) {}

  async execute(query: GetBillingPaymentStatusQuery) {
    const paymentOrder = await this.paymentOrderRepository.findById(
      query.paymentOrderId,
    );

    // Không trả thông tin đơn thuộc workspace khác.
    if (!paymentOrder || paymentOrder.getWorkspaceId() !== query.workspaceId) {
      throw new NotFoundException('Payment order not found');
    }

    return {
      paymentOrderId: paymentOrder.getId(),
      workspaceId: paymentOrder.getWorkspaceId(),
      planPriceId: paymentOrder.getPlanPriceId(),
      orderCode: paymentOrder.getOrderCode(),
      provider: paymentOrder.getProvider(),
      amount: paymentOrder.getAmount(),
      currency: paymentOrder.getCurrency(),
      status: paymentOrder.getStatus(),
      expiresAt: paymentOrder.getExpiresAt(),
    };
  }
}
