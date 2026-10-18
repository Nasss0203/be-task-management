/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException, NotFoundException } from '@nestjs/common';

import type { TemplateAnalyticsReader } from '../../../ports/template-analytics-reader.port';
import { ANALYTICS_TIME_ZONE } from '../../../services/template-analytics-range';
import { ListCreatorTemplateAnalyticsHandler } from '../list-creator-template-analytics/list-creator-template-analytics.handler';
import { ListCreatorTemplateAnalyticsQuery } from '../list-creator-template-analytics/list-creator-template-analytics.query';
import { GetCreatorTemplateAnalyticsHandler } from './get-creator-template-analytics.handler';
import { GetCreatorTemplateAnalyticsQuery } from './get-creator-template-analytics.query';

describe('creator template analytics handlers', () => {
  const totals = {
    views: 3,
    uniqueViewers: 2,
    guestViews: 1,
    uses: 1,
    paidPurchases: 1,
    grossRevenue: 50000,
  };
  let reader: jest.Mocked<TemplateAnalyticsReader>;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-18T03:00:00.000Z'));
    reader = {
      findTemplateOwner: jest.fn().mockResolvedValue({
        createdBy: 'creator-1',
        // 20:00 UTC on Oct 1 is Oct 2 in Vietnam.
        createdAt: new Date('2026-10-01T20:00:00.000Z'),
      }),
      listCreatorTotals: jest.fn().mockResolvedValue([]),
      getTemplateTotals: jest.fn().mockResolvedValue(totals),
      getTemplateDaily: jest.fn().mockResolvedValue([]),
      getTemplateVersions: jest.fn().mockResolvedValue([]),
      getCreatorDaily: jest.fn().mockResolvedValue([]),
      findCreatorFirstTemplateAt: jest
        .fn()
        .mockResolvedValue(new Date('2026-09-30T18:00:00.000Z')),
    };
  });

  afterEach(() => jest.useRealTimers());

  describe('GetCreatorTemplateAnalyticsHandler', () => {
    const get = (creatorId: string, from?: string, to?: string) =>
      new GetCreatorTemplateAnalyticsHandler(reader).execute(
        new GetCreatorTemplateAnalyticsQuery(creatorId, 'template-1', from, to),
      );

    it('returns totals, daily and versions for the bounded range', async () => {
      const result = await get('creator-1', '2026-10-01', '2026-10-07');
      const range = {
        from: '2026-10-01',
        to: '2026-10-07',
        timeZone: ANALYTICS_TIME_ZONE,
      };

      expect(reader.getTemplateTotals).toHaveBeenCalledWith(
        'template-1',
        range,
      );
      expect(reader.getTemplateDaily).toHaveBeenCalledWith('template-1', range);
      expect(reader.getTemplateVersions).toHaveBeenCalledWith(
        'template-1',
        range,
      );
      expect(result).toMatchObject({
        ...range,
        currency: 'VND',
        templateId: 'template-1',
        totals,
      });
    });

    it('starts an all-time chart on the creation day in Vietnam time', async () => {
      const result = await get('creator-1');

      expect(result.from).toBeNull();
      expect(reader.getTemplateTotals).toHaveBeenCalledWith(
        'template-1',
        expect.objectContaining({ from: null, to: '2026-10-18' }),
      );
      expect(reader.getTemplateDaily).toHaveBeenCalledWith(
        'template-1',
        expect.objectContaining({ from: '2026-10-02', to: '2026-10-18' }),
      );
    });

    it("hides other creators' templates and missing templates as 404", async () => {
      await expect(get('someone-else')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      reader.findTemplateOwner.mockResolvedValue(null);
      await expect(get('creator-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(reader.getTemplateTotals).not.toHaveBeenCalled();
    });

    it('rejects an invalid range before reading analytics', async () => {
      await expect(get('creator-1', '2026-10-07')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(reader.getTemplateTotals).not.toHaveBeenCalled();
    });
  });

  describe('ListCreatorTemplateAnalyticsHandler', () => {
    it("lists only the caller's templates for the range", async () => {
      reader.listCreatorTotals.mockResolvedValue([
        { templateId: 'template-1', name: 'Planner', totals },
      ]);

      const result = await new ListCreatorTemplateAnalyticsHandler(
        reader,
      ).execute(
        new ListCreatorTemplateAnalyticsQuery(
          'creator-1',
          '2026-09-19',
          '2026-10-18',
        ),
      );

      expect(reader.listCreatorTotals).toHaveBeenCalledWith('creator-1', {
        from: '2026-09-19',
        to: '2026-10-18',
        timeZone: ANALYTICS_TIME_ZONE,
      });
      expect(result.items).toHaveLength(1);
      expect(result.currency).toBe('VND');
    });

    it('adds a daily series summed over the bounded range', async () => {
      const handler = new ListCreatorTemplateAnalyticsHandler(reader);

      await handler.execute(
        new ListCreatorTemplateAnalyticsQuery(
          'creator-1',
          '2026-10-12',
          '2026-10-18',
        ),
      );

      expect(reader.getCreatorDaily).toHaveBeenCalledWith('creator-1', {
        from: '2026-10-12',
        to: '2026-10-18',
        timeZone: ANALYTICS_TIME_ZONE,
      });
      expect(reader.findCreatorFirstTemplateAt).not.toHaveBeenCalled();
    });

    it('starts an all-time series on the first template day in Vietnam time', async () => {
      const result = await new ListCreatorTemplateAnalyticsHandler(
        reader,
      ).execute(new ListCreatorTemplateAnalyticsQuery('creator-1'));

      expect(result.from).toBeNull();
      // 18:00 UTC on Sep 30 is Oct 1 in Vietnam.
      expect(reader.getCreatorDaily).toHaveBeenCalledWith(
        'creator-1',
        expect.objectContaining({ from: '2026-10-01', to: '2026-10-18' }),
      );
    });

    it('skips the series when the creator has no templates', async () => {
      reader.findCreatorFirstTemplateAt.mockResolvedValue(null);

      const result = await new ListCreatorTemplateAnalyticsHandler(
        reader,
      ).execute(new ListCreatorTemplateAnalyticsQuery('creator-1'));

      expect(result.daily).toEqual([]);
      expect(reader.getCreatorDaily).not.toHaveBeenCalled();
    });
  });
});
