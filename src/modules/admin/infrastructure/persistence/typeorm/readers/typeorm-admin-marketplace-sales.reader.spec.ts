import type { DataSource } from 'typeorm';

import { TypeOrmAdminMarketplaceSalesReader } from './typeorm-admin-marketplace-sales.reader';

function createReader(...results: unknown[]) {
  const query = jest.fn();
  results.forEach((result) => query.mockResolvedValueOnce(result));

  return {
    reader: new TypeOrmAdminMarketplaceSalesReader({
      query,
    } as unknown as DataSource),
    query,
  };
}

describe('TypeOrmAdminMarketplaceSalesReader.listReconciliationPurchases', () => {
  it('filters by status and search and maps ownership', async () => {
    const { reader, query } = createReader(
      [
        {
          id: 'purchase-1',
          orderCode: 'TM-1',
          provider: 'STRIPE',
          status: 'RECONCILIATION_REQUIRED',
          amount: '50000',
          currency: 'VND',
          templateId: 'template-1',
          templateName: 'Roadmap',
          buyerId: 'user-1',
          buyerEmail: 'buyer@example.com',
          buyerUsername: 'buyer',
          buyerOwnsTemplate: true,
          createdAt: '2026-11-19T08:00:00.000Z',
          updatedAt: '2026-11-19T09:00:00.000Z',
        },
      ],
      [{ total: '1' }],
    );

    const result = await reader.listReconciliationPurchases({
      page: 1,
      limit: 20,
      status: 'RECONCILIATION_REQUIRED',
      search: ' TM ',
    });

    const [listSql, listParameters] = query.mock.calls[0] as [
      string,
      unknown[],
    ];
    expect(listSql).toContain('purchase.status = $1');
    expect(listSql).toContain("entitlement.source::text = 'PAID_PURCHASE'");
    expect(listSql).not.toContain('idempotency_key');
    expect(listParameters).toEqual(['RECONCILIATION_REQUIRED', 'TM', 20, 0]);
    expect((query.mock.calls[1] as [string, unknown[]])[1]).toEqual([
      'RECONCILIATION_REQUIRED',
      'TM',
    ]);
    expect(result).toEqual({
      items: [
        {
          id: 'purchase-1',
          orderCode: 'TM-1',
          provider: 'STRIPE',
          status: 'RECONCILIATION_REQUIRED',
          amount: 50000,
          currency: 'VND',
          template: { id: 'template-1', name: 'Roadmap' },
          buyer: {
            id: 'user-1',
            email: 'buyer@example.com',
            username: 'buyer',
          },
          buyerOwnsTemplate: true,
          createdAt: new Date('2026-11-19T08:00:00.000Z'),
          updatedAt: new Date('2026-11-19T09:00:00.000Z'),
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });
  });

  it('passes null search and caps the page size', async () => {
    const { reader, query } = createReader([], [{ total: 0 }]);

    await reader.listReconciliationPurchases({
      page: 3,
      limit: 500,
      status: 'REFUNDED',
      search: '   ',
    });

    expect((query.mock.calls[0] as [string, unknown[]])[1]).toEqual([
      'REFUNDED',
      null,
      100,
      200,
    ]);
  });
});
