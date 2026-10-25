import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import type { BillingInterval } from '../constants/billing-interval.constant';
import type { BillingProvider } from '../constants/billing-provider.constant';
import type { PaymentOrderStatus } from '../constants/payment-order-status.constant';
import { PaymentOrder } from '../entities/payment-order.entity';

export interface PaymentOrderHistoryItem {
  id: string;
  orderCode: string;
  planCode: string;
  planName: string;
  billingInterval: BillingInterval;
  provider: BillingProvider;
  amount: number;
  currency: string;
  status: PaymentOrderStatus;
  paidAt: Date | null;
  createdAt: Date;
}

export interface PaymentOrderRepository {
  findHistoryByWorkspaceId(
    workspaceId: string,
    limit: number,
  ): Promise<PaymentOrderHistoryItem[]>;

  lockWorkspace(
    workspaceId: string,
    context: PersistenceContext,
  ): Promise<void>;

  save(
    paymentOrder: PaymentOrder,
    context?: PersistenceContext,
  ): Promise<PaymentOrder>;

  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<PaymentOrder | null>;

  findByOrderCode(
    orderCode: string,
    context?: PersistenceContext,
  ): Promise<PaymentOrder | null>;

  findByOrderCodeForUpdate(
    orderCode: string,
    context: PersistenceContext,
  ): Promise<PaymentOrder | null>;

  findUnexpiredPendingByWorkspaceIdAndPlanPriceId(
    workspaceId: string,
    planPriceId: string,
    now: Date,
    context?: PersistenceContext,
  ): Promise<PaymentOrder | null>;
}
