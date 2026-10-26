import { Inject, Injectable } from '@nestjs/common';

import { BILLING_TYPES } from '../../../../billing.types';
import type {
  PaymentOrderHistoryItem,
  PaymentOrderRepository,
} from '../../../../domain/repositories/payment-order.repository';
import { ListWorkspacePaymentOrdersQuery } from './list-workspace-payment-orders.query';

export const WORKSPACE_PAYMENT_HISTORY_LIMIT = 50;

@Injectable()
export class ListWorkspacePaymentOrdersHandler {
  constructor(
    @Inject(BILLING_TYPES.repositories.PaymentOrderRepository)
    private readonly paymentOrderRepository: PaymentOrderRepository,
  ) {}

  execute(
    query: ListWorkspacePaymentOrdersQuery,
  ): Promise<PaymentOrderHistoryItem[]> {
    return this.paymentOrderRepository.findHistoryByWorkspaceId(
      query.workspaceId,
      WORKSPACE_PAYMENT_HISTORY_LIMIT,
    );
  }
}
