import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type { TemplatePurchaseProvider } from 'src/modules/marketplace/domain/aggregates/template-purchase/template-purchase.aggregate';

import type {
  AdminMarketplaceSalesOverview,
  AdminMarketplaceSalesReader,
  AdminMarketplaceSalesTotals,
  AdminReconciliationStatus,
  ListAdminMarketplaceSalesInput,
  ListAdminMarketplaceSalesResult,
  ListAdminReconciliationPurchasesInput,
  ListAdminReconciliationPurchasesResult,
} from '../../../../application/ports/admin-marketplace-sales-reader.port';

interface TotalsRawRow {
  grossSales: string;
  platformRevenue: string;
  paidPurchases: number | string;
}

interface SaleRawRow {
  id: string;
  orderCode: string;
  provider: TemplatePurchaseProvider | null;
  templateId: string;
  templateName: string;
  buyerId: string;
  buyerEmail: string;
  buyerUsername: string;
  creatorId: string;
  creatorEmail: string;
  creatorUsername: string;
  amount: string;
  commissionRateBps: number;
  platformFeeAmount: string;
  currency: string;
  paidAt: Date | string;
}

const SALES_FROM = `
  FROM template_purchases purchase
  INNER JOIN page_templates template ON template.id = purchase.template_id
  INNER JOIN users buyer ON buyer.id = purchase.buyer_id
  INNER JOIN users creator ON creator.id = template.created_by
  WHERE purchase.status = 'PAID'
    AND (
      $1::text IS NULL
      OR purchase.order_code ILIKE '%' || $1 || '%'
      OR template.name ILIKE '%' || $1 || '%'
      OR buyer.email ILIKE '%' || $1 || '%'
      OR buyer.username ILIKE '%' || $1 || '%'
      OR creator.email ILIKE '%' || $1 || '%'
      OR creator.username ILIKE '%' || $1 || '%'
    )
`;

interface ReconciliationRawRow {
  id: string;
  orderCode: string;
  provider: TemplatePurchaseProvider | null;
  status: AdminReconciliationStatus;
  amount: string;
  currency: string;
  templateId: string;
  templateName: string;
  buyerId: string;
  buyerEmail: string;
  buyerUsername: string;
  buyerOwnsTemplate: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const RECONCILIATION_FROM = `
  FROM template_purchases purchase
  INNER JOIN page_templates template ON template.id = purchase.template_id
  INNER JOIN users buyer ON buyer.id = purchase.buyer_id
  WHERE purchase.status = $1
    AND (
      $2::text IS NULL
      OR purchase.order_code ILIKE '%' || $2 || '%'
      OR template.name ILIKE '%' || $2 || '%'
      OR buyer.email ILIKE '%' || $2 || '%'
      OR buyer.username ILIKE '%' || $2 || '%'
    )
`;

function toTotals(row: TotalsRawRow | undefined): AdminMarketplaceSalesTotals {
  const grossSales = Number(row?.grossSales ?? 0);
  const platformRevenue = Number(row?.platformRevenue ?? 0);

  return {
    grossSales,
    platformRevenue,
    creatorEarnings: grossSales - platformRevenue,
    paidPurchases: Number(row?.paidPurchases ?? 0),
  };
}

@Injectable()
export class TypeOrmAdminMarketplaceSalesReader implements AdminMarketplaceSalesReader {
  constructor(private readonly dataSource: DataSource) {}

  async getOverview(timeZone: string): Promise<AdminMarketplaceSalesOverview> {
    const rows = await this.dataSource.query<
      Array<TotalsRawRow & { scope: 'month' | 'all' }>
    >(
      `
        WITH paid AS (
          SELECT amount, platform_fee_amount, paid_at
          FROM template_purchases
          WHERE status = 'PAID'
        ),
        month_start AS (
          SELECT DATE_TRUNC('month', CURRENT_TIMESTAMP AT TIME ZONE $1::text)
            AT TIME ZONE $1::text AS start_at
        )
        SELECT 'all' AS scope,
          COALESCE(SUM(amount), 0)::text AS "grossSales",
          COALESCE(SUM(platform_fee_amount), 0)::text AS "platformRevenue",
          COUNT(*)::int AS "paidPurchases"
        FROM paid
        UNION ALL
        SELECT 'month' AS scope,
          COALESCE(SUM(amount), 0)::text,
          COALESCE(SUM(platform_fee_amount), 0)::text,
          COUNT(*)::int
        FROM paid, month_start
        WHERE paid.paid_at >= month_start.start_at
      `,
      [timeZone],
    );

    return {
      thisMonth: toTotals(rows.find((row) => row.scope === 'month')),
      allTime: toTotals(rows.find((row) => row.scope === 'all')),
      timeZone,
      currency: 'VND',
    };
  }

  async listSales(
    input: ListAdminMarketplaceSalesInput,
  ): Promise<ListAdminMarketplaceSalesResult> {
    const page = Number.isFinite(input.page)
      ? Math.max(1, Math.floor(input.page))
      : 1;
    const limit = Number.isFinite(input.limit)
      ? Math.min(100, Math.max(1, Math.floor(input.limit)))
      : 20;
    const search = input.search?.trim() || null;
    const offset = (page - 1) * limit;

    const rows = await this.dataSource.query<SaleRawRow[]>(
      `
        SELECT
          purchase.id AS "id",
          purchase.order_code AS "orderCode",
          purchase.provider AS "provider",
          template.id AS "templateId",
          template.name AS "templateName",
          buyer.id AS "buyerId",
          buyer.email AS "buyerEmail",
          buyer.username AS "buyerUsername",
          creator.id AS "creatorId",
          creator.email AS "creatorEmail",
          creator.username AS "creatorUsername",
          purchase.amount::text AS "amount",
          purchase.commission_rate_bps AS "commissionRateBps",
          purchase.platform_fee_amount::text AS "platformFeeAmount",
          purchase.currency AS "currency",
          purchase.paid_at AS "paidAt"
        ${SALES_FROM}
        ORDER BY purchase.paid_at DESC, purchase.id
        LIMIT $2
        OFFSET $3
      `,
      [search, limit, offset],
    );

    const countRows = await this.dataSource.query<
      Array<{ total: number | string }>
    >(`SELECT COUNT(*) AS total ${SALES_FROM}`, [search]);

    return {
      items: rows.map((row) => {
        const amount = Number(row.amount);
        const platformFeeAmount = Number(row.platformFeeAmount);

        return {
          id: row.id,
          orderCode: row.orderCode,
          provider: row.provider,
          template: { id: row.templateId, name: row.templateName },
          buyer: {
            id: row.buyerId,
            email: row.buyerEmail,
            username: row.buyerUsername,
          },
          creator: {
            id: row.creatorId,
            email: row.creatorEmail,
            username: row.creatorUsername,
          },
          amount,
          commissionRateBps: row.commissionRateBps,
          platformFeeAmount,
          creatorEarnings: amount - platformFeeAmount,
          currency: row.currency,
          paidAt: new Date(row.paidAt),
        };
      }),
      total: Number(countRows[0]?.total ?? 0),
      page,
      limit,
    };
  }

  async listReconciliationPurchases(
    input: ListAdminReconciliationPurchasesInput,
  ): Promise<ListAdminReconciliationPurchasesResult> {
    const page = Number.isFinite(input.page)
      ? Math.max(1, Math.floor(input.page))
      : 1;
    const limit = Number.isFinite(input.limit)
      ? Math.min(100, Math.max(1, Math.floor(input.limit)))
      : 20;
    const filters = [input.status, input.search?.trim() || null];

    const rows = await this.dataSource.query<ReconciliationRawRow[]>(
      `
        SELECT
          purchase.id AS "id",
          purchase.order_code AS "orderCode",
          purchase.provider AS "provider",
          purchase.status AS "status",
          purchase.amount::text AS "amount",
          purchase.currency AS "currency",
          template.id AS "templateId",
          template.name AS "templateName",
          buyer.id AS "buyerId",
          buyer.email AS "buyerEmail",
          buyer.username AS "buyerUsername",
          EXISTS (
            SELECT 1
            FROM template_entitlements entitlement
            WHERE entitlement.template_id = purchase.template_id
              AND entitlement.user_id = purchase.buyer_id
              AND entitlement.source::text = 'PAID_PURCHASE'
          ) AS "buyerOwnsTemplate",
          purchase.created_at AS "createdAt",
          purchase.updated_at AS "updatedAt"
        ${RECONCILIATION_FROM}
        ORDER BY purchase.updated_at DESC, purchase.id
        LIMIT $3
        OFFSET $4
      `,
      [...filters, limit, (page - 1) * limit],
    );

    const countRows = await this.dataSource.query<
      Array<{ total: number | string }>
    >(`SELECT COUNT(*) AS total ${RECONCILIATION_FROM}`, filters);

    return {
      items: rows.map((row) => ({
        id: row.id,
        orderCode: row.orderCode,
        provider: row.provider,
        status: row.status,
        amount: Number(row.amount),
        currency: row.currency,
        template: { id: row.templateId, name: row.templateName },
        buyer: {
          id: row.buyerId,
          email: row.buyerEmail,
          username: row.buyerUsername,
        },
        buyerOwnsTemplate: row.buyerOwnsTemplate === true,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })),
      total: Number(countRows[0]?.total ?? 0),
      page,
      limit,
    };
  }
}
