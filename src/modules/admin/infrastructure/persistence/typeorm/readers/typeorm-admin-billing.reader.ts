import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type {
  AdminBillingOverview,
  AdminBillingPaymentOrderSummary,
  AdminBillingReader,
  AdminBillingSubscriptionSummary,
  ListAdminBillingPaymentOrdersInput,
  ListAdminBillingPaymentOrdersResult,
  ListAdminBillingSubscriptionsInput,
  ListAdminBillingSubscriptionsResult,
} from '../../../../application/ports/admin-billing-reader.port';

interface AdminBillingOverviewRawRow {
  paidRevenueThisMonth: number | string;
  activeSubscriptions: number | string;
  pendingPayments: number | string;
  failedOrExpiredPayments: number | string;
  failedWebhookEvents: number | string;
}

interface AdminBillingSubscriptionRawRow {
  id: string;

  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;

  planId: string;
  planCode: string;
  planName: string;

  planPriceId: string | null;
  billingInterval:
    | NonNullable<
        AdminBillingSubscriptionSummary['planPrice']
      >['billingInterval']
    | null;
  priceAmount: number | string | null;
  priceCurrency: string | null;

  provider: AdminBillingSubscriptionSummary['provider'];
  status: AdminBillingSubscriptionSummary['status'];

  currentPeriodStart: Date | string | null;
  currentPeriodEnd: Date | string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | string | null;

  latestPaymentId: string | null;
  latestPaymentOrderCode: string | null;
  latestPaymentProvider:
    | NonNullable<AdminBillingSubscriptionSummary['latestPayment']>['provider']
    | null;
  latestPaymentStatus:
    | NonNullable<AdminBillingSubscriptionSummary['latestPayment']>['status']
    | null;
  latestPaymentAmount: number | string | null;
  latestPaymentCurrency: string | null;
  latestPaymentPaidAt: Date | string | null;
  latestPaymentCreatedAt: Date | string | null;

  createdAt: Date | string;
  updatedAt: Date | string;
}

interface AdminBillingPaymentOrderRawRow {
  id: string;
  subscriptionId: string | null;

  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;

  planId: string;
  planCode: string;
  planName: string;

  planPriceId: string;
  billingInterval: AdminBillingPaymentOrderSummary['planPrice']['billingInterval'];
  priceAmount: number | string;
  priceCurrency: string;

  provider: AdminBillingPaymentOrderSummary['provider'];
  orderCode: string;
  amount: number | string;
  currency: string;
  status: AdminBillingPaymentOrderSummary['status'];
  expiresAt: Date | string | null;
  paidAt: Date | string | null;
  createdBy: string;

  latestTransactionId: string | null;
  latestTransactionProvider:
    | NonNullable<
        AdminBillingPaymentOrderSummary['latestTransaction']
      >['provider']
    | null;
  latestProviderTransactionId: string | null;
  latestTransactionAmount: number | string | null;
  latestTransactionCurrency: string | null;
  latestTransactionStatus:
    | NonNullable<
        AdminBillingPaymentOrderSummary['latestTransaction']
      >['status']
    | null;
  latestTransactionPaidAt: Date | string | null;
  latestTransactionCreatedAt: Date | string | null;

  createdAt: Date | string;
  updatedAt: Date | string;
}

const EFFECTIVE_PAYMENT_ORDER_STATUS_SQL = `
  CASE
    WHEN payment_order.status = 'PENDING'
      AND payment_order.expires_at IS NOT NULL
      AND payment_order.expires_at <= CURRENT_TIMESTAMP
    THEN 'EXPIRED'
    ELSE payment_order.status::text
  END
`;

@Injectable()
export class TypeOrmAdminBillingReader implements AdminBillingReader {
  constructor(private readonly dataSource: DataSource) {}

  async getOverview(): Promise<AdminBillingOverview> {
    const rows = await this.dataSource.query<AdminBillingOverviewRawRow[]>(
      `
        SELECT
          (
            SELECT COALESCE(SUM(amount), 0)
            FROM payment_orders
            WHERE status = 'PAID'
              AND currency = 'VND'
              AND paid_at >= DATE_TRUNC('month', CURRENT_TIMESTAMP)
              AND paid_at < DATE_TRUNC('month', CURRENT_TIMESTAMP)
                + INTERVAL '1 month'
          ) AS "paidRevenueThisMonth",

          (
            SELECT COUNT(*)::int
            FROM workspace_subscriptions
            WHERE status = 'ACTIVE'
          ) AS "activeSubscriptions",

          (
            SELECT COUNT(*)::int
            FROM payment_orders
            WHERE status = 'PENDING'
              AND (
                expires_at IS NULL
                OR expires_at > CURRENT_TIMESTAMP
              )
          ) AS "pendingPayments",

          (
            SELECT COUNT(*)::int
            FROM payment_orders
            WHERE status IN ('FAILED', 'EXPIRED')
              OR (
                status = 'PENDING'
                AND expires_at IS NOT NULL
                AND expires_at <= CURRENT_TIMESTAMP
              )
          ) AS "failedOrExpiredPayments",

          (
            SELECT COUNT(*)::int
            FROM billing_webhook_events
            WHERE status = 'FAILED'
          ) AS "failedWebhookEvents"
      `,
    );

    const row = rows[0];

    return {
      paidRevenueThisMonth: Number(row?.paidRevenueThisMonth ?? 0),
      activeSubscriptions: Number(row?.activeSubscriptions ?? 0),
      pendingPayments: Number(row?.pendingPayments ?? 0),
      failedOrExpiredPayments: Number(row?.failedOrExpiredPayments ?? 0),
      failedWebhookEvents: Number(row?.failedWebhookEvents ?? 0),
      currency: 'VND',
    };
  }

  async listSubscriptions(
    input: ListAdminBillingSubscriptionsInput,
  ): Promise<ListAdminBillingSubscriptionsResult> {
    const page = Number.isFinite(input.page)
      ? Math.max(1, Math.floor(input.page))
      : 1;

    const limit = Number.isFinite(input.limit)
      ? Math.min(100, Math.max(1, Math.floor(input.limit)))
      : 20;

    const search = input.search?.trim() || null;
    const status = input.status ?? null;
    const provider = input.provider ?? null;
    const planCode = input.planCode?.trim() || null;
    const offset = (page - 1) * limit;

    const parameters = [search, status, provider, planCode, limit, offset];

    const rows = await this.dataSource.query<AdminBillingSubscriptionRawRow[]>(
      `
        SELECT
          subscription.id AS "id",

          workspace.id AS "workspaceId",
          workspace.name AS "workspaceName",
          workspace.slug AS "workspaceSlug",

          plan.id AS "planId",
          plan.code AS "planCode",
          plan.name AS "planName",

          price.id AS "planPriceId",
          price.billing_interval AS "billingInterval",
          price.amount AS "priceAmount",
          price.currency AS "priceCurrency",

          subscription.provider AS "provider",
          subscription.status AS "status",
          subscription.current_period_start AS "currentPeriodStart",
          subscription.current_period_end AS "currentPeriodEnd",
          subscription.cancel_at_period_end AS "cancelAtPeriodEnd",
          subscription.canceled_at AS "canceledAt",

          latest_payment.id AS "latestPaymentId",
          latest_payment.order_code AS "latestPaymentOrderCode",
          latest_payment.provider AS "latestPaymentProvider",
          latest_payment.status AS "latestPaymentStatus",
          latest_payment.amount AS "latestPaymentAmount",
          latest_payment.currency AS "latestPaymentCurrency",
          latest_payment.paid_at AS "latestPaymentPaidAt",
          latest_payment.created_at AS "latestPaymentCreatedAt",

          subscription.created_at AS "createdAt",
          subscription.updated_at AS "updatedAt"

        FROM workspace_subscriptions subscription

        INNER JOIN workspaces workspace
          ON workspace.id = subscription.workspace_id

        INNER JOIN billing_plans plan
          ON plan.id = subscription.plan_id

        LEFT JOIN billing_plan_prices price
          ON price.id = subscription.plan_price_id

        LEFT JOIN LATERAL (
          SELECT
            payment.id,
            payment.order_code,
            payment.provider,
            payment.status,
            payment.amount,
            payment.currency,
            payment.paid_at,
            payment.created_at
          FROM payment_orders payment
          WHERE payment.subscription_id = subscription.id
          ORDER BY payment.created_at DESC, payment.id DESC
          LIMIT 1
        ) latest_payment ON TRUE

        WHERE workspace.deleted_at IS NULL
          AND (
            $1::text IS NULL
            OR workspace.name ILIKE '%' || $1 || '%'
            OR workspace.slug ILIKE '%' || $1 || '%'
            OR workspace.id::text ILIKE '%' || $1 || '%'
            OR subscription.id::text ILIKE '%' || $1 || '%'
            OR plan.name ILIKE '%' || $1 || '%'
            OR plan.code ILIKE '%' || $1 || '%'
            OR EXISTS (
              SELECT 1
              FROM payment_orders payment_search
              WHERE payment_search.subscription_id = subscription.id
                AND payment_search.order_code ILIKE '%' || $1 || '%'
            )
          )
          AND (
            $2::text IS NULL
            OR subscription.status::text = $2::text
          )
          AND (
            $3::text IS NULL
            OR subscription.provider::text = $3::text
          )
          AND (
            $4::text IS NULL
            OR UPPER(plan.code) = UPPER($4)
          )

        ORDER BY subscription.updated_at DESC
        LIMIT $5
        OFFSET $6
      `,
      parameters,
    );

    const countRows = await this.dataSource.query<
      Array<{ total: number | string }>
    >(
      `
        SELECT COUNT(*) AS total
        FROM workspace_subscriptions subscription

        INNER JOIN workspaces workspace
          ON workspace.id = subscription.workspace_id

        INNER JOIN billing_plans plan
          ON plan.id = subscription.plan_id

        WHERE workspace.deleted_at IS NULL
          AND (
            $1::text IS NULL
            OR workspace.name ILIKE '%' || $1 || '%'
            OR workspace.slug ILIKE '%' || $1 || '%'
            OR workspace.id::text ILIKE '%' || $1 || '%'
            OR subscription.id::text ILIKE '%' || $1 || '%'
            OR plan.name ILIKE '%' || $1 || '%'
            OR plan.code ILIKE '%' || $1 || '%'
            OR EXISTS (
              SELECT 1
              FROM payment_orders payment_search
              WHERE payment_search.subscription_id = subscription.id
                AND payment_search.order_code ILIKE '%' || $1 || '%'
            )
          )
          AND (
            $2::text IS NULL
            OR subscription.status::text = $2::text
          )
          AND (
            $3::text IS NULL
            OR subscription.provider::text = $3::text
          )
          AND (
            $4::text IS NULL
            OR UPPER(plan.code) = UPPER($4)
          )
      `,
      [search, status, provider, planCode],
    );

    return {
      items: rows.map((row) => ({
        id: row.id,
        workspace: {
          id: row.workspaceId,
          name: row.workspaceName,
          slug: row.workspaceSlug,
        },
        plan: {
          id: row.planId,
          code: row.planCode,
          name: row.planName,
        },
        planPrice:
          row.planPriceId &&
          row.billingInterval &&
          row.priceAmount !== null &&
          row.priceCurrency
            ? {
                id: row.planPriceId,
                billingInterval: row.billingInterval,
                amount: Number(row.priceAmount),
                currency: row.priceCurrency,
              }
            : null,
        provider: row.provider,
        status: row.status,
        currentPeriodStart: row.currentPeriodStart
          ? new Date(row.currentPeriodStart)
          : null,
        currentPeriodEnd: row.currentPeriodEnd
          ? new Date(row.currentPeriodEnd)
          : null,
        cancelAtPeriodEnd: row.cancelAtPeriodEnd,
        canceledAt: row.canceledAt ? new Date(row.canceledAt) : null,
        latestPayment:
          row.latestPaymentId &&
          row.latestPaymentOrderCode &&
          row.latestPaymentProvider &&
          row.latestPaymentStatus &&
          row.latestPaymentAmount !== null &&
          row.latestPaymentCurrency &&
          row.latestPaymentCreatedAt
            ? {
                id: row.latestPaymentId,
                orderCode: row.latestPaymentOrderCode,
                provider: row.latestPaymentProvider,
                status: row.latestPaymentStatus,
                amount: Number(row.latestPaymentAmount),
                currency: row.latestPaymentCurrency,
                paidAt: row.latestPaymentPaidAt
                  ? new Date(row.latestPaymentPaidAt)
                  : null,
                createdAt: new Date(row.latestPaymentCreatedAt),
              }
            : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })),
      total: Number(countRows[0]?.total ?? 0),
      page,
      limit,
    };
  }

  async listPaymentOrders(
    input: ListAdminBillingPaymentOrdersInput,
  ): Promise<ListAdminBillingPaymentOrdersResult> {
    const page = Number.isFinite(input.page)
      ? Math.max(1, Math.floor(input.page))
      : 1;

    const limit = Number.isFinite(input.limit)
      ? Math.min(100, Math.max(1, Math.floor(input.limit)))
      : 20;

    const search = input.search?.trim() || null;
    const status = input.status ?? null;
    const provider = input.provider ?? null;
    const planCode = input.planCode?.trim() || null;
    const offset = (page - 1) * limit;

    const rows = await this.dataSource.query<AdminBillingPaymentOrderRawRow[]>(
      `
        SELECT
          payment_order.id AS "id",
          payment_order.subscription_id AS "subscriptionId",

          workspace.id AS "workspaceId",
          workspace.name AS "workspaceName",
          workspace.slug AS "workspaceSlug",

          plan.id AS "planId",
          plan.code AS "planCode",
          plan.name AS "planName",

          price.id AS "planPriceId",
          price.billing_interval AS "billingInterval",
          price.amount AS "priceAmount",
          price.currency AS "priceCurrency",

          payment_order.provider AS "provider",
          payment_order.order_code AS "orderCode",
          payment_order.amount AS "amount",
          payment_order.currency AS "currency",
          ${EFFECTIVE_PAYMENT_ORDER_STATUS_SQL} AS "status",
          payment_order.expires_at AS "expiresAt",
          payment_order.paid_at AS "paidAt",
          payment_order.created_by AS "createdBy",

          latest_transaction.id AS "latestTransactionId",
          latest_transaction.provider AS "latestTransactionProvider",
          latest_transaction.provider_transaction_id
            AS "latestProviderTransactionId",
          latest_transaction.amount AS "latestTransactionAmount",
          latest_transaction.currency AS "latestTransactionCurrency",
          latest_transaction.status AS "latestTransactionStatus",
          latest_transaction.paid_at AS "latestTransactionPaidAt",
          latest_transaction.created_at AS "latestTransactionCreatedAt",

          payment_order.created_at AS "createdAt",
          payment_order.updated_at AS "updatedAt"

        FROM payment_orders payment_order

        INNER JOIN workspaces workspace
          ON workspace.id = payment_order.workspace_id

        INNER JOIN billing_plan_prices price
          ON price.id = payment_order.plan_price_id

        INNER JOIN billing_plans plan
          ON plan.id = price.plan_id

        LEFT JOIN LATERAL (
          SELECT
            payment_transaction.id,
            payment_transaction.provider,
            payment_transaction.provider_transaction_id,
            payment_transaction.amount,
            payment_transaction.currency,
            payment_transaction.status,
            payment_transaction.paid_at,
            payment_transaction.created_at
          FROM payment_transactions payment_transaction
          WHERE payment_transaction.payment_order_id = payment_order.id
          ORDER BY
            payment_transaction.created_at DESC,
            payment_transaction.id DESC
          LIMIT 1
        ) latest_transaction ON TRUE

        WHERE (
          $1::text IS NULL
          OR payment_order.order_code ILIKE '%' || $1 || '%'
          OR payment_order.id::text ILIKE '%' || $1 || '%'
          OR workspace.name ILIKE '%' || $1 || '%'
          OR workspace.slug ILIKE '%' || $1 || '%'
          OR workspace.id::text ILIKE '%' || $1 || '%'
          OR plan.name ILIKE '%' || $1 || '%'
          OR plan.code ILIKE '%' || $1 || '%'
          OR EXISTS (
            SELECT 1
            FROM payment_transactions transaction_search
            WHERE transaction_search.payment_order_id = payment_order.id
              AND transaction_search.provider_transaction_id
                ILIKE '%' || $1 || '%'
          )
        )
        AND (
          $2::text IS NULL
          OR (${EFFECTIVE_PAYMENT_ORDER_STATUS_SQL}) = $2::text
        )
        AND (
          $3::text IS NULL
          OR payment_order.provider::text = $3::text
        )
        AND (
          $4::text IS NULL
          OR UPPER(plan.code) = UPPER($4)
        )

        ORDER BY payment_order.created_at DESC
        LIMIT $5
        OFFSET $6
      `,
      [search, status, provider, planCode, limit, offset],
    );

    const countRows = await this.dataSource.query<
      Array<{ total: number | string }>
    >(
      `
        SELECT COUNT(*) AS total

        FROM payment_orders payment_order

        INNER JOIN workspaces workspace
          ON workspace.id = payment_order.workspace_id

        INNER JOIN billing_plan_prices price
          ON price.id = payment_order.plan_price_id

        INNER JOIN billing_plans plan
          ON plan.id = price.plan_id

        WHERE (
          $1::text IS NULL
          OR payment_order.order_code ILIKE '%' || $1 || '%'
          OR payment_order.id::text ILIKE '%' || $1 || '%'
          OR workspace.name ILIKE '%' || $1 || '%'
          OR workspace.slug ILIKE '%' || $1 || '%'
          OR workspace.id::text ILIKE '%' || $1 || '%'
          OR plan.name ILIKE '%' || $1 || '%'
          OR plan.code ILIKE '%' || $1 || '%'
          OR EXISTS (
            SELECT 1
            FROM payment_transactions transaction_search
            WHERE transaction_search.payment_order_id = payment_order.id
              AND transaction_search.provider_transaction_id
                ILIKE '%' || $1 || '%'
          )
        )
        AND (
          $2::text IS NULL
          OR (${EFFECTIVE_PAYMENT_ORDER_STATUS_SQL}) = $2::text
        )
        AND (
          $3::text IS NULL
          OR payment_order.provider::text = $3::text
        )
        AND (
          $4::text IS NULL
          OR UPPER(plan.code) = UPPER($4)
        )
      `,
      [search, status, provider, planCode],
    );

    return {
      items: rows.map((row) => ({
        id: row.id,
        subscriptionId: row.subscriptionId,
        workspace: {
          id: row.workspaceId,
          name: row.workspaceName,
          slug: row.workspaceSlug,
        },
        plan: {
          id: row.planId,
          code: row.planCode,
          name: row.planName,
        },
        planPrice: {
          id: row.planPriceId,
          billingInterval: row.billingInterval,
          amount: Number(row.priceAmount),
          currency: row.priceCurrency,
        },
        provider: row.provider,
        orderCode: row.orderCode,
        amount: Number(row.amount),
        currency: row.currency,
        status: row.status,
        expiresAt: row.expiresAt ? new Date(row.expiresAt) : null,
        paidAt: row.paidAt ? new Date(row.paidAt) : null,
        createdBy: row.createdBy,
        latestTransaction:
          row.latestTransactionId &&
          row.latestTransactionProvider &&
          row.latestTransactionAmount !== null &&
          row.latestTransactionCurrency &&
          row.latestTransactionStatus &&
          row.latestTransactionCreatedAt
            ? {
                id: row.latestTransactionId,
                provider: row.latestTransactionProvider,
                providerTransactionId: row.latestProviderTransactionId,
                amount: Number(row.latestTransactionAmount),
                currency: row.latestTransactionCurrency,
                status: row.latestTransactionStatus,
                paidAt: row.latestTransactionPaidAt
                  ? new Date(row.latestTransactionPaidAt)
                  : null,
                createdAt: new Date(row.latestTransactionCreatedAt),
              }
            : null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })),
      total: Number(countRows[0]?.total ?? 0),
      page,
      limit,
    };
  }
}
