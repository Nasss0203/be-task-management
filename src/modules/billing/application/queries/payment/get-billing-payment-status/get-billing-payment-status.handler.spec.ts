import { NotFoundException } from '@nestjs/common';

import { BillingProvider } from '../../../../domain/constants/billing-provider.constant';
import { PaymentOrderStatus } from '../../../../domain/constants/payment-order-status.constant';
import { PaymentOrder } from '../../../../domain/entities/payment-order.entity';
import { GetBillingPaymentStatusHandler } from './get-billing-payment-status.handler';
import { GetBillingPaymentStatusQuery } from './get-billing-payment-status.query';

const HOUR_MS = 60 * 60 * 1000;

function buildOrder(status: PaymentOrderStatus, expiresAt: Date | null) {
  const createdAt = new Date(Date.now() - 2 * HOUR_MS);
  return PaymentOrder.reconstitute({
    id: 'order-1',
    workspaceId: 'workspace-1',
    subscriptionId: null,
    planPriceId: 'price-business',
    provider: BillingProvider.SEPAY,
    orderCode: 'TM123',
    amount: 249000,
    creditAmount: 0,
    currency: 'VND',
    status,
    expiresAt,
    paidAt: status === PaymentOrderStatus.PAID ? createdAt : null,
    createdBy: 'user-1',
    createdAt,
    updatedAt: createdAt,
  });
}

describe('GetBillingPaymentStatusHandler', () => {
  const paymentOrderRepository = { findById: jest.fn() };
  const handler = new GetBillingPaymentStatusHandler(
    paymentOrderRepository as never,
  );
  const query = new GetBillingPaymentStatusQuery('workspace-1', 'order-1');

  beforeEach(() => jest.clearAllMocks());

  it('reports a pending order past its expiry as expired', async () => {
    paymentOrderRepository.findById.mockResolvedValue(
      buildOrder(PaymentOrderStatus.PENDING, new Date(Date.now() - HOUR_MS)),
    );

    const result = await handler.execute(query);

    expect(result.status).toBe(PaymentOrderStatus.EXPIRED);
  });

  it('keeps a pending order before its expiry as pending', async () => {
    paymentOrderRepository.findById.mockResolvedValue(
      buildOrder(PaymentOrderStatus.PENDING, new Date(Date.now() + HOUR_MS)),
    );

    const result = await handler.execute(query);

    expect(result.status).toBe(PaymentOrderStatus.PENDING);
  });

  it('keeps a pending order without expiry as pending', async () => {
    paymentOrderRepository.findById.mockResolvedValue(
      buildOrder(PaymentOrderStatus.PENDING, null),
    );

    const result = await handler.execute(query);

    expect(result.status).toBe(PaymentOrderStatus.PENDING);
  });

  it('keeps a paid order as paid after its expiry', async () => {
    paymentOrderRepository.findById.mockResolvedValue(
      buildOrder(PaymentOrderStatus.PAID, new Date(Date.now() - HOUR_MS)),
    );

    const result = await handler.execute(query);

    expect(result.status).toBe(PaymentOrderStatus.PAID);
  });

  it('hides an order of another workspace', async () => {
    paymentOrderRepository.findById.mockResolvedValue(
      buildOrder(PaymentOrderStatus.PENDING, null),
    );

    await expect(
      handler.execute(
        new GetBillingPaymentStatusQuery('workspace-2', 'order-1'),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
