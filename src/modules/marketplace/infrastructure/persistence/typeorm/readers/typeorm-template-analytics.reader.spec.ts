import { DataSource } from 'typeorm';

import { TypeOrmTemplateAnalyticsReader } from './typeorm-template-analytics.reader';

describe('TypeOrmTemplateAnalyticsReader', () => {
  const range = {
    from: '2026-10-01',
    to: '2026-10-07',
    timeZone: 'Asia/Ho_Chi_Minh',
  };
  let query: jest.Mock;
  let reader: TypeOrmTemplateAnalyticsReader;

  beforeEach(() => {
    query = jest.fn();
    reader = new TypeOrmTemplateAnalyticsReader({
      query,
    } as unknown as DataSource);
  });

  it('binds the range in a fixed parameter order and excludes the creator', async () => {
    query.mockResolvedValue([]);

    await reader.getTemplateTotals('template-1', range);

    const [sql, params] = query.mock.calls[0] as [string, unknown[]];
    expect(params).toEqual([
      'template-1',
      '2026-10-01',
      '2026-10-07',
      'Asia/Ho_Chi_Minh',
    ]);
    expect(sql).toContain('WHERE id = $1');
    expect(sql).toContain('e.user_id IS DISTINCT FROM t.created_by');
    expect(sql).toContain("p.status = 'PAID'");
  });

  it('scopes the list by creator and converts bigint revenue to numbers', async () => {
    query.mockResolvedValue([
      {
        template_id: 'template-1',
        name: 'Planner',
        views: 3,
        unique_viewers: 2,
        guest_views: 1,
        uses: 1,
        paid_purchases: 2,
        gross_revenue: '150000',
      },
    ]);

    const result = await reader.listCreatorTotals('creator-1', {
      ...range,
      from: null,
    });

    const [sql, params] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('WHERE created_by = $1');
    expect(params[1]).toBeNull();
    expect(result).toEqual([
      {
        templateId: 'template-1',
        name: 'Planner',
        totals: {
          views: 3,
          uniqueViewers: 2,
          guestViews: 1,
          uses: 1,
          paidPurchases: 2,
          grossRevenue: 150000,
        },
      },
    ]);
  });

  it('returns zero totals when the template has no row', async () => {
    query.mockResolvedValue([]);

    await expect(reader.getTemplateTotals('missing', range)).resolves.toEqual({
      views: 0,
      uniqueViewers: 0,
      guestViews: 0,
      uses: 0,
      paidPurchases: 0,
      grossRevenue: 0,
    });
  });

  it('maps daily and version rows', async () => {
    query
      .mockResolvedValueOnce([
        {
          date: '2026-10-01',
          views: 1,
          uses: 0,
          paid_purchases: 0,
          gross_revenue: '0',
        },
      ])
      .mockResolvedValueOnce([
        {
          version_id: 'version-1',
          version_number: 2,
          uses: 4,
          paid_purchases: 1,
          gross_revenue: '50000',
        },
      ]);

    await expect(reader.getTemplateDaily('template-1', range)).resolves.toEqual(
      [
        {
          date: '2026-10-01',
          views: 1,
          uses: 0,
          paidPurchases: 0,
          grossRevenue: 0,
        },
      ],
    );
    await expect(
      reader.getTemplateVersions('template-1', range),
    ).resolves.toEqual([
      {
        versionId: 'version-1',
        versionNumber: 2,
        uses: 4,
        paidPurchases: 1,
        grossRevenue: 50000,
      },
    ]);
  });

  it('reads the template owner', async () => {
    const createdAt = new Date('2026-10-01T00:00:00.000Z');
    query.mockResolvedValueOnce([
      { created_by: 'creator-1', created_at: createdAt },
    ]);
    query.mockResolvedValueOnce([]);

    await expect(reader.findTemplateOwner('template-1')).resolves.toEqual({
      createdBy: 'creator-1',
      createdAt,
    });
    await expect(reader.findTemplateOwner('missing')).resolves.toBeNull();
  });
});
