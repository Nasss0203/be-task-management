import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type {
  TemplateAnalyticsDailyPoint,
  TemplateAnalyticsOwner,
  TemplateAnalyticsRange,
  TemplateAnalyticsReader,
  TemplateAnalyticsSale,
  TemplateAnalyticsTemplateTotals,
  TemplateAnalyticsTotals,
  TemplateAnalyticsVersionPoint,
} from '../../../../application/ports/template-analytics-reader.port';

// Every query binds $2 = from (date | null), $3 = to (date, inclusive), $4 = time zone.
// Calendar days are turned into instants in SQL so day boundaries follow the zone.
const inRange = (column: string) =>
  `($2::date IS NULL OR ${column} >= ($2::date)::timestamp AT TIME ZONE $4::text)` +
  ` AND ${column} < (($3::date + 1)::timestamp AT TIME ZONE $4::text)`;

// The creator's own views/uses are not audience traffic.
const NOT_CREATOR = 'e.user_id IS DISTINCT FROM t.created_by';

type TotalsRow = {
  template_id: string;
  name: string;
  views: number;
  unique_viewers: number;
  guest_views: number;
  uses: number;
  paid_purchases: number;
  gross_revenue: string;
  earnings: string;
};

@Injectable()
export class TypeOrmTemplateAnalyticsReader implements TemplateAnalyticsReader {
  constructor(private readonly dataSource: DataSource) {}

  async findTemplateOwner(
    templateId: string,
  ): Promise<TemplateAnalyticsOwner | null> {
    const rows: { created_by: string; created_at: Date }[] =
      await this.dataSource.query(
        'SELECT created_by, created_at FROM page_templates WHERE id = $1',
        [templateId],
      );

    return rows[0]
      ? { createdBy: rows[0].created_by, createdAt: rows[0].created_at }
      : null;
  }

  async listCreatorTotals(
    creatorId: string,
    range: TemplateAnalyticsRange,
  ): Promise<TemplateAnalyticsTemplateTotals[]> {
    const rows = await this.totals('created_by', creatorId, range);

    return rows.map((row) => ({
      templateId: row.template_id,
      name: row.name,
      totals: toTotals(row),
    }));
  }

  async getTemplateTotals(
    templateId: string,
    range: TemplateAnalyticsRange,
  ): Promise<TemplateAnalyticsTotals> {
    const [row] = await this.totals('id', templateId, range);

    return row
      ? toTotals(row)
      : {
          views: 0,
          uniqueViewers: 0,
          guestViews: 0,
          uses: 0,
          paidPurchases: 0,
          grossRevenue: 0,
          earnings: 0,
        };
  }

  getTemplateDaily(
    templateId: string,
    range: TemplateAnalyticsRange & { from: string },
  ): Promise<TemplateAnalyticsDailyPoint[]> {
    return this.daily('id', templateId, range);
  }

  getCreatorDaily(
    creatorId: string,
    range: TemplateAnalyticsRange & { from: string },
  ): Promise<TemplateAnalyticsDailyPoint[]> {
    return this.daily('created_by', creatorId, range);
  }

  async findCreatorFirstTemplateAt(creatorId: string): Promise<Date | null> {
    const rows: { first_at: Date | null }[] = await this.dataSource.query(
      'SELECT MIN(created_at) AS first_at FROM page_templates WHERE created_by = $1',
      [creatorId],
    );

    return rows[0]?.first_at ?? null;
  }

  async getTemplateVersions(
    templateId: string,
    range: TemplateAnalyticsRange,
  ): Promise<TemplateAnalyticsVersionPoint[]> {
    const rows: {
      version_id: string;
      version_number: number;
      uses: number;
      paid_purchases: number;
      gross_revenue: string;
      earnings: string;
    }[] = await this.dataSource.query(
      `
      WITH t AS (
        SELECT id, created_by FROM page_templates WHERE id = $1
      ),
      ev AS (
        SELECT e.version_id, COUNT(*) AS uses
        FROM template_analytics_events e
        JOIN t ON t.id = e.template_id
        WHERE e.event_type = 'USE' AND ${NOT_CREATOR} AND ${inRange('e.created_at')}
        GROUP BY e.version_id
      ),
      pu AS (
        SELECT p.published_version_id AS version_id,
          COUNT(*) AS paid_purchases,
          SUM(p.amount) AS gross_revenue,
          SUM(p.amount - p.platform_fee_amount) AS earnings
        FROM template_purchases p
        WHERE p.template_id = $1 AND p.status = 'PAID' AND ${inRange('p.paid_at')}
        GROUP BY p.published_version_id
      )
      SELECT v.id AS version_id, v.version_number,
        COALESCE(ev.uses, 0)::int AS uses,
        COALESCE(pu.paid_purchases, 0)::int AS paid_purchases,
        COALESCE(pu.gross_revenue, 0)::text AS gross_revenue,
        COALESCE(pu.earnings, 0)::text AS earnings
      FROM page_template_versions v
      LEFT JOIN ev ON ev.version_id = v.id
      LEFT JOIN pu ON pu.version_id = v.id
      WHERE v.template_id = $1
        AND (v.status = 'PUBLISHED' OR ev.version_id IS NOT NULL OR pu.version_id IS NOT NULL)
      ORDER BY v.version_number DESC
      `,
      [templateId, range.from, range.to, range.timeZone],
    );

    return rows.map((row) => ({
      versionId: row.version_id,
      versionNumber: row.version_number,
      uses: row.uses,
      paidPurchases: row.paid_purchases,
      grossRevenue: Number(row.gross_revenue),
      earnings: Number(row.earnings),
    }));
  }

  async getTemplateSales(
    templateId: string,
    range: TemplateAnalyticsRange,
    limit: number,
  ): Promise<TemplateAnalyticsSale[]> {
    const rows: {
      id: string;
      order_code: string;
      paid_at: Date;
      version_number: number | null;
      amount: string;
      commission_rate_bps: number;
      platform_fee_amount: string;
    }[] = await this.dataSource.query(
      `
      SELECT p.id, p.order_code, p.paid_at, v.version_number,
        p.amount::text AS amount,
        p.commission_rate_bps,
        p.platform_fee_amount::text AS platform_fee_amount
      FROM template_purchases p
      LEFT JOIN page_template_versions v ON v.id = p.published_version_id
      WHERE p.template_id = $1 AND p.status = 'PAID' AND ${inRange('p.paid_at')}
      ORDER BY p.paid_at DESC, p.id
      LIMIT $5
      `,
      [templateId, range.from, range.to, range.timeZone, limit],
    );

    return rows.map((row) => {
      const amount = Number(row.amount);
      const platformFeeAmount = Number(row.platform_fee_amount);

      return {
        purchaseId: row.id,
        orderCode: row.order_code,
        paidAt: row.paid_at,
        versionNumber: row.version_number,
        amount,
        commissionRateBps: row.commission_rate_bps,
        platformFeeAmount,
        earnings: amount - platformFeeAmount,
      };
    });
  }

  // filterColumn is one of two fixed literals, never user input.
  private async daily(
    filterColumn: 'id' | 'created_by',
    value: string,
    range: TemplateAnalyticsRange & { from: string },
  ): Promise<TemplateAnalyticsDailyPoint[]> {
    const rows: {
      date: string;
      views: number;
      uses: number;
      paid_purchases: number;
      gross_revenue: string;
      earnings: string;
    }[] = await this.dataSource.query(
      `
      WITH t AS (
        SELECT id, created_by FROM page_templates WHERE ${filterColumn} = $1
      ),
      days AS (
        SELECT generate_series($2::date, $3::date, interval '1 day')::date AS day
      ),
      ev AS (
        SELECT (e.created_at AT TIME ZONE $4::text)::date AS day,
          COUNT(*) FILTER (WHERE e.event_type = 'VIEW') AS views,
          COUNT(*) FILTER (WHERE e.event_type = 'USE') AS uses
        FROM template_analytics_events e
        JOIN t ON t.id = e.template_id
        WHERE ${NOT_CREATOR} AND ${inRange('e.created_at')}
        GROUP BY 1
      ),
      pu AS (
        SELECT (p.paid_at AT TIME ZONE $4::text)::date AS day,
          COUNT(*) AS paid_purchases,
          SUM(p.amount) AS gross_revenue,
          SUM(p.amount - p.platform_fee_amount) AS earnings
        FROM template_purchases p
        JOIN t ON t.id = p.template_id
        WHERE p.status = 'PAID' AND ${inRange('p.paid_at')}
        GROUP BY 1
      )
      SELECT to_char(d.day, 'YYYY-MM-DD') AS date,
        COALESCE(ev.views, 0)::int AS views,
        COALESCE(ev.uses, 0)::int AS uses,
        COALESCE(pu.paid_purchases, 0)::int AS paid_purchases,
        COALESCE(pu.gross_revenue, 0)::text AS gross_revenue,
        COALESCE(pu.earnings, 0)::text AS earnings
      FROM days d
      LEFT JOIN ev ON ev.day = d.day
      LEFT JOIN pu ON pu.day = d.day
      ORDER BY d.day
      `,
      [value, range.from, range.to, range.timeZone],
    );

    return rows.map((row) => ({
      date: row.date,
      views: row.views,
      uses: row.uses,
      paidPurchases: row.paid_purchases,
      grossRevenue: Number(row.gross_revenue),
      earnings: Number(row.earnings),
    }));
  }

  private totals(
    filterColumn: 'id' | 'created_by',
    value: string,
    range: TemplateAnalyticsRange,
  ): Promise<TotalsRow[]> {
    return this.dataSource.query(
      `
      WITH t AS (
        SELECT id, name, created_by, created_at
        FROM page_templates
        WHERE ${filterColumn} = $1
      ),
      ev AS (
        SELECT e.template_id,
          COUNT(*) FILTER (WHERE e.event_type = 'VIEW') AS views,
          COUNT(DISTINCT e.user_id) FILTER (WHERE e.event_type = 'VIEW') AS unique_viewers,
          COUNT(*) FILTER (WHERE e.event_type = 'VIEW' AND e.user_id IS NULL) AS guest_views,
          COUNT(*) FILTER (WHERE e.event_type = 'USE') AS uses
        FROM template_analytics_events e
        JOIN t ON t.id = e.template_id
        WHERE ${NOT_CREATOR} AND ${inRange('e.created_at')}
        GROUP BY e.template_id
      ),
      pu AS (
        SELECT p.template_id,
          COUNT(*) AS paid_purchases,
          SUM(p.amount) AS gross_revenue,
          SUM(p.amount - p.platform_fee_amount) AS earnings
        FROM template_purchases p
        JOIN t ON t.id = p.template_id
        WHERE p.status = 'PAID' AND ${inRange('p.paid_at')}
        GROUP BY p.template_id
      )
      SELECT t.id AS template_id, t.name,
        COALESCE(ev.views, 0)::int AS views,
        COALESCE(ev.unique_viewers, 0)::int AS unique_viewers,
        COALESCE(ev.guest_views, 0)::int AS guest_views,
        COALESCE(ev.uses, 0)::int AS uses,
        COALESCE(pu.paid_purchases, 0)::int AS paid_purchases,
        COALESCE(pu.gross_revenue, 0)::text AS gross_revenue,
        COALESCE(pu.earnings, 0)::text AS earnings
      FROM t
      LEFT JOIN ev ON ev.template_id = t.id
      LEFT JOIN pu ON pu.template_id = t.id
      ORDER BY t.created_at DESC, t.id
      `,
      [value, range.from, range.to, range.timeZone],
    );
  }
}

function toTotals(row: TotalsRow): TemplateAnalyticsTotals {
  return {
    views: row.views,
    uniqueViewers: row.unique_viewers,
    guestViews: row.guest_views,
    uses: row.uses,
    paidPurchases: row.paid_purchases,
    // bigint arrives as text; VND totals stay well inside Number's safe range.
    grossRevenue: Number(row.gross_revenue),
    earnings: Number(row.earnings),
  };
}
