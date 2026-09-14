import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import { PaymentOrder } from '../entities/payment-order.entity';

export interface PaymentOrderRepository {
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
