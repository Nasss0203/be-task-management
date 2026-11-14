import { BadRequestException } from '@nestjs/common';

import { BillingWebhookStatus } from '../../../../domain/constants/billing-webhook-status.constant';
import type { BillingWebhookEvent } from '../../../../domain/entities/billing-webhook-event.entity';
import type { SepayPgIpnRequestDto } from '../../../dto/request/sepay-pg-ipn.request.dto';
import { ProcessSepayPgIpnCommand } from './process-sepay-pg-ipn.command';
import { ProcessSepayPgIpnHandler } from './process-sepay-pg-ipn.handler';

const ORDER_CODE = `TM${'C3'.repeat(16)}`;

type PayloadOverrides = {
  notification_type?: string;
  order?: Partial<SepayPgIpnRequestDto['order']>;
  transaction?: Partial<SepayPgIpnRequestDto['transaction']>;
};

describe('ProcessSepayPgIpnHandler', () => {
  const webhookEventRepository = {
    insertIfAbsent: jest.fn<Promise<boolean>, [BillingWebhookEvent]>(),
    save: jest.fn<Promise<void>, [BillingWebhookEvent]>(),
  };
  const settlement = {
    settle: jest.fn(),
  };
  const unitOfWork = {
    runInTransaction: (work: (context: unknown) => Promise<unknown>) =>
      work({}),
  };
  const handler = new ProcessSepayPgIpnHandler(
    webhookEventRepository as never,
    settlement as never,
    unitOfWork as never,
  );

  const run = (overrides: PayloadOverrides = {}) =>
    handler.execute(
      new ProcessSepayPgIpnCommand({
        timestamp: 1769835600,
        notification_type: overrides.notification_type ?? 'ORDER_PAID',
        order: {
          id: 'order-1',
          order_id: 'pg-order-1',
          order_status: 'CAPTURED',
          order_currency: 'VND',
          order_amount: '99000',
          order_invoice_number: ORDER_CODE.toLowerCase(),
          ...overrides.order,
        },
        transaction: {
          id: 'txn-1',
          payment_method: 'BANK_TRANSFER',
          transaction_id: 'txn-1',
          transaction_type: 'PAYMENT',
          transaction_date: '2026-01-31 12:00:00',
          transaction_status: 'APPROVED',
          transaction_amount: '99000.00',
          transaction_currency: 'VND',
          ...overrides.transaction,
        },
      }),
    );

  const savedStatus = () =>
    webhookEventRepository.save.mock.calls.at(-1)?.[0].getStatus();

  beforeEach(() => {
    jest.clearAllMocks();
    webhookEventRepository.insertIfAbsent.mockResolvedValue(true);
    settlement.settle.mockResolvedValue('PROCESSED');
  });

  it('settles a captured payment with the normalized order code and amount', async () => {
    await run();

    expect(settlement.settle).toHaveBeenCalledWith(
      expect.objectContaining({
        orderCode: ORDER_CODE,
        amount: 99000,
        currency: 'VND',
        paidAt: new Date('2026-01-31T05:00:00Z'),
      }),
    );
    expect(
      webhookEventRepository.insertIfAbsent.mock.calls[0][0].getProviderEventId(),
    ).toBe('PG:ORDER_PAID:txn-1');
    expect(savedStatus()).toBe(BillingWebhookStatus.PROCESSED);
  });

  it('rejects a payload without a transaction id before recording it', async () => {
    await expect(run({ transaction: { id: ' ' } })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(webhookEventRepository.insertIfAbsent).not.toHaveBeenCalled();
  });

  it('skips a notification it has already recorded', async () => {
    webhookEventRepository.insertIfAbsent.mockResolvedValue(false);

    await run();

    expect(settlement.settle).not.toHaveBeenCalled();
  });

  it.each<[string, PayloadOverrides]>([
    ['a non payment notification', { notification_type: 'ORDER_CANCELED' }],
    [
      'an order amount different from the transaction',
      { order: { order_amount: '1000' } },
    ],
    [
      'a fractional amount',
      { transaction: { transaction_amount: '99000.50' } },
    ],
    [
      'an unsupported payment method',
      { transaction: { payment_method: 'CRYPTO' } },
    ],
    [
      'a declined transaction',
      { transaction: { transaction_status: 'DECLINED' } },
    ],
    ['a refund', { transaction: { transaction_type: 'REFUND' } }],
    ['a foreign currency', { order: { order_currency: 'USD' } }],
    [
      'an order that is not captured',
      { order: { order_status: 'AUTHORIZED' } },
    ],
    ['a malformed order code', { order: { order_invoice_number: 'TM123' } }],
    [
      'a malformed transaction date',
      { transaction: { transaction_date: '2026-01-31' } },
    ],
  ])('ignores %s without settling', async (_label, overrides) => {
    await run(overrides);

    expect(settlement.settle).not.toHaveBeenCalled();
    expect(savedStatus()).toBe(BillingWebhookStatus.IGNORED);
  });
});
