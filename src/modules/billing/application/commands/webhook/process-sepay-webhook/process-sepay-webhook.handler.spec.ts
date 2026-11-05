import { BillingWebhookStatus } from '../../../../domain/constants/billing-webhook-status.constant';
import { BillingProvider } from '../../../../domain/constants/billing-provider.constant';
import type { BillingWebhookEvent } from '../../../../domain/entities/billing-webhook-event.entity';
import type { SePayWebhookRequestDto } from '../../../dto/request/sepay-webhook.request.dto';
import { ProcessSepayWebhookCommand } from './process-sepay-webhook.command';
import { ProcessSepayWebhookHandler } from './process-sepay-webhook.handler';

const ORDER_CODE = `TM${'A1'.repeat(16)}`;

describe('ProcessSepayWebhookHandler', () => {
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
  const handler = new ProcessSepayWebhookHandler(
    webhookEventRepository as never,
    settlement as never,
    unitOfWork as never,
  );

  const payload = (
    overrides: Partial<SePayWebhookRequestDto> = {},
  ): SePayWebhookRequestDto => ({
    id: 101,
    gateway: 'MBBank',
    transactionDate: '2026-01-31 12:00:00',
    accountNumber: '0123456789',
    content: `CK ${ORDER_CODE} thanh toan`,
    transferType: 'in',
    transferAmount: 99000,
    accumulated: 99000,
    referenceCode: 'FT001',
    ...overrides,
  });

  const run = (overrides: Partial<SePayWebhookRequestDto> = {}) =>
    handler.execute(new ProcessSepayWebhookCommand(payload(overrides)));

  const savedStatus = () =>
    webhookEventRepository.save.mock.calls.at(-1)?.[0].getStatus();

  beforeEach(() => {
    jest.clearAllMocks();
    webhookEventRepository.insertIfAbsent.mockResolvedValue(true);
    settlement.settle.mockResolvedValue('PROCESSED');
  });

  it('settles an incoming transfer using the order code found in the content', async () => {
    await run({ content: `ck ${ORDER_CODE.toLowerCase()} thanh toan` });

    expect(settlement.settle).toHaveBeenCalledWith(
      expect.objectContaining({
        orderCode: ORDER_CODE,
        provider: BillingProvider.SEPAY,
        amount: 99000,
        currency: 'VND',
        paidAt: new Date('2026-01-31T05:00:00Z'),
      }),
    );
    expect(savedStatus()).toBe(BillingWebhookStatus.PROCESSED);
  });

  it('prefers the code field over a code inside the content', async () => {
    const otherCode = `TM${'F'.repeat(32)}`;

    await run({ code: ORDER_CODE.toLowerCase(), content: `CK ${otherCode}` });

    expect(settlement.settle).toHaveBeenCalledWith(
      expect.objectContaining({ orderCode: ORDER_CODE }),
    );
  });

  it('skips a transaction it has already recorded', async () => {
    webhookEventRepository.insertIfAbsent.mockResolvedValue(false);

    await run();

    expect(settlement.settle).not.toHaveBeenCalled();
    expect(webhookEventRepository.save).not.toHaveBeenCalled();
  });

  it.each([
    ['an outgoing transfer', { transferType: 'out' as const }],
    ['content without an order code', { content: 'CK chuyen tien' }],
    ['a malformed transaction date', { transactionDate: '31/01/2026 12:00' }],
  ])('ignores %s without settling', async (_label, overrides) => {
    await run(overrides);

    expect(settlement.settle).not.toHaveBeenCalled();
    expect(savedStatus()).toBe(BillingWebhookStatus.IGNORED);
  });

  it('records the event as ignored when settlement ignores the payment', async () => {
    settlement.settle.mockResolvedValue('IGNORED');

    await run();

    expect(savedStatus()).toBe(BillingWebhookStatus.IGNORED);
  });
});
