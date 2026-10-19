import { TemplatePurchase } from './template-purchase.aggregate';

const create = (amount: number, commissionRateBps: number) =>
  TemplatePurchase.create({
    templateId: 'template-1',
    listingId: 'listing-1',
    buyerId: 'buyer-1',
    publishedVersionId: 'version-1',
    amount,
    currency: 'VND',
    commissionRateBps,
    idempotencyKey: 'key-1',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });

describe('TemplatePurchase commission', () => {
  it.each([
    [100000, 500, 5000],
    [99999, 500, 4999],
    [100000, 0, 0],
    [100000, 10000, 100000],
    [Number.MAX_SAFE_INTEGER, 1, 900719925474],
  ])('amount %i at %i bps keeps fee %i', (amount, rate, fee) => {
    const purchase = create(amount, rate);

    expect(purchase.getCommissionRateBps()).toBe(rate);
    expect(purchase.getPlatformFeeAmount()).toBe(fee);
  });

  it.each([-1, 10001, 2.5, Number.NaN])('rejects rate %p', (rate) => {
    expect(() => create(100000, rate)).toThrow('Invalid commission rate');
  });
});
