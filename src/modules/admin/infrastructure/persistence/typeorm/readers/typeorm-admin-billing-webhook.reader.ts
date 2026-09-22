import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type {
  AdminBillingWebhookEventSummary,
  AdminBillingWebhookReader,
  ListAdminBillingWebhookEventsInput,
  ListAdminBillingWebhookEventsResult,
} from '../../../../application/ports/admin-billing-webhook-reader.port';

interface AdminBillingWebhookEventRawRow {
  id: string;
  provider: AdminBillingWebhookEventSummary['provider'];
  providerEventId: string;
  eventType: string;
  status: AdminBillingWebhookEventSummary['status'];

  paymentOrderId: string | null;
  orderCode: string | null;
  paymentOrderStatus:
    | NonNullable<AdminBillingWebhookEventSummary['paymentOrder']>['status']
    | null;

  workspaceId: string | null;
  workspaceName: string | null;
  workspaceSlug: string | null;

  planId: string | null;
  planCode: string | null;
  planName: string | null;

  processedAt: Date | string | null;
  createdAt: Date | string;
}

@Injectable()
export class TypeOrmAdminBillingWebhookReader implements AdminBillingWebhookReader {
  constructor(private readonly dataSource: DataSource) {}

  async listWebhookEvents(
    input: ListAdminBillingWebhookEventsInput,
  ): Promise<ListAdminBillingWebhookEventsResult> {
    const page = Number.isFinite(input.page)
      ? Math.max(1, Math.floor(input.page))
      : 1;

    const limit = Number.isFinite(input.limit)
      ? Math.min(100, Math.max(1, Math.floor(input.limit)))
      : 20;

    const search = input.search?.trim() || null;
    const provider = input.provider ?? null;
    const status = input.status ?? null;
    const eventType = input.eventType?.trim() || null;
    const offset = (page - 1) * limit;

    const rows = await this.dataSource.query<AdminBillingWebhookEventRawRow[]>(
      `
        SELECT
          webhook.id AS "id",
          webhook.provider AS "provider",
          webhook.provider_event_id AS "providerEventId",
          webhook.event_type AS "eventType",
          webhook.status AS "status",

          payment_order.id AS "paymentOrderId",
          payment_order.order_code AS "orderCode",
          payment_order.status AS "paymentOrderStatus",

          workspace.id AS "workspaceId",
          workspace.name AS "workspaceName",
          workspace.slug AS "workspaceSlug",

          plan.id AS "planId",
          plan.code AS "planCode",
          plan.name AS "planName",

          webhook.processed_at AS "processedAt",
          webhook.created_at AS "createdAt"

        FROM billing_webhook_events webhook

        LEFT JOIN LATERAL (
          SELECT
            NULLIF(
              webhook.payload #>>
                '{data,object,metadata,paymentOrderId}',
              ''
            ) AS payment_order_id,

            COALESCE(
              NULLIF(
                UPPER(
                  webhook.payload #>>
                    '{data,object,metadata,orderCode}'
                ),
                ''
              ),
              NULLIF(
                UPPER(
                  webhook.payload #>>
                    '{order,order_invoice_number}'
                ),
                ''
              ),
              CASE
                WHEN UPPER(
                  COALESCE(webhook.payload ->> 'code', '')
                ) ~ '^TM[A-F0-9]{32}$'
                  THEN UPPER(webhook.payload ->> 'code')
                ELSE SUBSTRING(
                  UPPER(
                    COALESCE(webhook.payload ->> 'content', '')
                  )
                  FROM 'TM[A-F0-9]{32}'
                )
              END
            ) AS order_code
        ) extracted_order ON TRUE

        LEFT JOIN payment_orders payment_order
          ON (
            extracted_order.payment_order_id IS NOT NULL
            AND payment_order.id::text =
              extracted_order.payment_order_id
          )
          OR (
            extracted_order.payment_order_id IS NULL
            AND extracted_order.order_code IS NOT NULL
            AND payment_order.order_code =
              extracted_order.order_code
          )

        LEFT JOIN workspaces workspace
          ON workspace.id = payment_order.workspace_id

        LEFT JOIN billing_plan_prices price
          ON price.id = payment_order.plan_price_id

        LEFT JOIN billing_plans plan
          ON plan.id = price.plan_id

        WHERE (
          $1::text IS NULL
          OR webhook.id::text ILIKE '%' || $1 || '%'
          OR webhook.provider_event_id ILIKE '%' || $1 || '%'
          OR webhook.event_type ILIKE '%' || $1 || '%'
          OR extracted_order.order_code ILIKE '%' || $1 || '%'
          OR payment_order.order_code ILIKE '%' || $1 || '%'
          OR workspace.name ILIKE '%' || $1 || '%'
          OR workspace.slug ILIKE '%' || $1 || '%'
          OR plan.name ILIKE '%' || $1 || '%'
          OR plan.code ILIKE '%' || $1 || '%'
        )
        AND (
          $2::text IS NULL
          OR webhook.provider::text = $2::text
        )
        AND (
          $3::text IS NULL
          OR webhook.status::text = $3::text
        )
        AND (
          $4::text IS NULL
          OR LOWER(webhook.event_type) = LOWER($4)
        )

        ORDER BY webhook.created_at DESC, webhook.id DESC
        LIMIT $5
        OFFSET $6
      `,
      [search, provider, status, eventType, limit, offset],
    );

    const countRows = await this.dataSource.query<
      Array<{ total: number | string }>
    >(
      `
        SELECT COUNT(*) AS total

        FROM billing_webhook_events webhook

        LEFT JOIN LATERAL (
          SELECT
            NULLIF(
              webhook.payload #>>
                '{data,object,metadata,paymentOrderId}',
              ''
            ) AS payment_order_id,

            COALESCE(
              NULLIF(
                UPPER(
                  webhook.payload #>>
                    '{data,object,metadata,orderCode}'
                ),
                ''
              ),
              NULLIF(
                UPPER(
                  webhook.payload #>>
                    '{order,order_invoice_number}'
                ),
                ''
              ),
              CASE
                WHEN UPPER(
                  COALESCE(webhook.payload ->> 'code', '')
                ) ~ '^TM[A-F0-9]{32}$'
                  THEN UPPER(webhook.payload ->> 'code')
                ELSE SUBSTRING(
                  UPPER(
                    COALESCE(webhook.payload ->> 'content', '')
                  )
                  FROM 'TM[A-F0-9]{32}'
                )
              END
            ) AS order_code
        ) extracted_order ON TRUE

        LEFT JOIN payment_orders payment_order
          ON (
            extracted_order.payment_order_id IS NOT NULL
            AND payment_order.id::text =
              extracted_order.payment_order_id
          )
          OR (
            extracted_order.payment_order_id IS NULL
            AND extracted_order.order_code IS NOT NULL
            AND payment_order.order_code =
              extracted_order.order_code
          )

        LEFT JOIN workspaces workspace
          ON workspace.id = payment_order.workspace_id

        LEFT JOIN billing_plan_prices price
          ON price.id = payment_order.plan_price_id

        LEFT JOIN billing_plans plan
          ON plan.id = price.plan_id

        WHERE (
          $1::text IS NULL
          OR webhook.id::text ILIKE '%' || $1 || '%'
          OR webhook.provider_event_id ILIKE '%' || $1 || '%'
          OR webhook.event_type ILIKE '%' || $1 || '%'
          OR extracted_order.order_code ILIKE '%' || $1 || '%'
          OR payment_order.order_code ILIKE '%' || $1 || '%'
          OR workspace.name ILIKE '%' || $1 || '%'
          OR workspace.slug ILIKE '%' || $1 || '%'
          OR plan.name ILIKE '%' || $1 || '%'
          OR plan.code ILIKE '%' || $1 || '%'
        )
        AND (
          $2::text IS NULL
          OR webhook.provider::text = $2::text
        )
        AND (
          $3::text IS NULL
          OR webhook.status::text = $3::text
        )
        AND (
          $4::text IS NULL
          OR LOWER(webhook.event_type) = LOWER($4)
        )
      `,
      [search, provider, status, eventType],
    );

    return {
      items: rows.map((row) => ({
        id: row.id,
        provider: row.provider,
        providerEventId: row.providerEventId,
        eventType: row.eventType,
        status: row.status,
        paymentOrder:
          row.paymentOrderId &&
          row.orderCode &&
          row.paymentOrderStatus &&
          row.workspaceId &&
          row.workspaceName &&
          row.workspaceSlug &&
          row.planId &&
          row.planCode &&
          row.planName
            ? {
                id: row.paymentOrderId,
                orderCode: row.orderCode,
                status: row.paymentOrderStatus,
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
              }
            : null,
        processedAt: row.processedAt ? new Date(row.processedAt) : null,
        createdAt: new Date(row.createdAt),
      })),
      total: Number(countRows[0]?.total ?? 0),
      page,
      limit,
    };
  }
}
