import { NotFoundException } from '@nestjs/common';

import {
  TemplatePurchase,
  TemplatePurchaseProvider,
  TemplatePurchaseStatus,
} from '../../../../domain/aggregates/template-purchase/template-purchase.aggregate';
import type { TemplatePurchaseRepository } from '../../../../domain/repositories/template-purchase.repository';
import { GetTemplatePurchaseHandler } from './get-template-purchase.handler';
import { GetTemplatePurchaseQuery } from './get-template-purchase.query';

describe('GetTemplatePurchaseHandler', () => {
  const purchase = (status: TemplatePurchaseStatus) =>
    TemplatePurchase.restore({
      id: 'purchase-1',
      orderCode: 'TP00000000000000000000000000000000',
      templateId: 'template-1',
      listingId: 'listing-1',
      buyerId: 'buyer-1',
      publishedVersionId: 'version-1',
      amount: 50000,
      currency: 'VND',
      commissionRateBps: 0,
      platformFeeAmount: 0,
      idempotencyKey: 'key-1',
      expiresAt: new Date('2026-10-18T10:00:00Z'),
      status,
      provider: TemplatePurchaseProvider.STRIPE,
      entitlementId: status === TemplatePurchaseStatus.PAID ? 'ent-1' : null,
      paidAt:
        status === TemplatePurchaseStatus.PAID
          ? new Date('2026-10-18T09:05:00Z')
          : null,
      createdAt: new Date('2026-10-18T09:00:00Z'),
      updatedAt: new Date('2026-10-18T09:05:00Z'),
    });

  const setup = (found: TemplatePurchase | null) => {
    const repository = {
      findById: jest.fn().mockResolvedValue(found),
      save: jest.fn(),
      create: jest.fn(),
    };
    const handler = new GetTemplatePurchaseHandler(
      repository as unknown as TemplatePurchaseRepository,
    );
    return { handler, repository };
  };

  it.each(Object.values(TemplatePurchaseStatus))(
    'returns the buyer their own %s purchase without writing',
    async (status) => {
      const { handler, repository } = setup(purchase(status));

      const result = await handler.execute(
        new GetTemplatePurchaseQuery('purchase-1', 'buyer-1'),
      );

      expect(result).toMatchObject({
        id: 'purchase-1',
        templateId: 'template-1',
        status,
        amount: 50000,
        currency: 'VND',
      });
      expect(repository.save).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    },
  );

  it('includes paidAt for a paid purchase and no internal ids', async () => {
    const { handler } = setup(purchase(TemplatePurchaseStatus.PAID));

    const result = await handler.execute(
      new GetTemplatePurchaseQuery('purchase-1', 'buyer-1'),
    );

    expect(result.paidAt).toEqual(new Date('2026-10-18T09:05:00Z'));
    expect(result).not.toHaveProperty('idempotencyKey');
    expect(result).not.toHaveProperty('entitlementId');
    expect(result).not.toHaveProperty('provider');
  });

  it('answers 404 for another buyer, like a missing purchase', async () => {
    await expect(
      setup(purchase(TemplatePurchaseStatus.PAID)).handler.execute(
        new GetTemplatePurchaseQuery('purchase-1', 'someone-else'),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      setup(null).handler.execute(
        new GetTemplatePurchaseQuery('missing', 'buyer-1'),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
