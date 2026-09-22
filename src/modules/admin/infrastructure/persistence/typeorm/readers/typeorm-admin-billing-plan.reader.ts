import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type {
  AdminBillingPlanDetail,
  AdminBillingPlanFeatureSummary,
  AdminBillingPlanPriceSummary,
  AdminBillingPlanReader,
  AdminBillingPlanSummary,
  ListAdminBillingPlansInput,
  ListAdminBillingPlansResult,
} from '../../../../application/ports/admin-billing-plan-reader.port';

interface AdminBillingPlanRawRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isPublic: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface AdminBillingPlanPriceRawRow {
  id: string;
  planId: string;
  billingInterval: AdminBillingPlanPriceSummary['billingInterval'];
  currency: string;
  amount: number | string;
  provider: AdminBillingPlanPriceSummary['provider'];
  providerPriceId: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface AdminBillingPlanFeatureRawRow {
  id: string;
  planFeatureId: string | null;
  code: string;
  name: string;
  description: string | null;
  valueType: AdminBillingPlanFeatureSummary['valueType'];
  value: AdminBillingPlanFeatureSummary['value'];
}

@Injectable()
export class TypeOrmAdminBillingPlanReader implements AdminBillingPlanReader {
  constructor(private readonly dataSource: DataSource) {}

  async getPlanById(planId: string): Promise<AdminBillingPlanDetail | null> {
    const planRows = await this.dataSource.query<AdminBillingPlanRawRow[]>(
      `
        SELECT
          plan.id AS "id",
          plan.code AS "code",
          plan.name AS "name",
          plan.description AS "description",
          plan.is_active AS "isActive",
          plan.is_public AS "isPublic",
          plan.created_at AS "createdAt",
          plan.updated_at AS "updatedAt"
        FROM billing_plans plan
        WHERE plan.id = $1
        LIMIT 1
      `,
      [planId],
    );

    const plan = planRows[0];

    if (!plan) {
      return null;
    }

    const [priceRows, featureRows] = await Promise.all([
      this.dataSource.query<AdminBillingPlanPriceRawRow[]>(
        `
          SELECT
            price.id AS "id",
            price.plan_id AS "planId",
            price.billing_interval AS "billingInterval",
            price.currency AS "currency",
            price.amount AS "amount",
            price.provider AS "provider",
            price.provider_price_id AS "providerPriceId",
            price.is_active AS "isActive",
            price.created_at AS "createdAt",
            price.updated_at AS "updatedAt"
          FROM billing_plan_prices price
          WHERE price.plan_id = $1
          ORDER BY
            CASE price.billing_interval::text
              WHEN 'MONTHLY' THEN 1
              WHEN 'YEARLY' THEN 2
              ELSE 100
            END,
            CASE price.provider::text
              WHEN 'STRIPE' THEN 1
              WHEN 'SEPAY' THEN 2
              ELSE 100
            END,
            price.created_at ASC
        `,
        [planId],
      ),
      this.dataSource.query<AdminBillingPlanFeatureRawRow[]>(
        `
          SELECT
            feature.id AS "id",
            plan_feature.id AS "planFeatureId",
            feature.code AS "code",
            feature.name AS "name",
            feature.description AS "description",
            feature.value_type AS "valueType",
            plan_feature.value AS "value"
          FROM billing_features feature
          LEFT JOIN billing_plan_features plan_feature
            ON plan_feature.feature_id = feature.id
            AND plan_feature.plan_id = $1
          ORDER BY feature.code ASC, feature.id ASC
        `,
        [planId],
      ),
    ]);

    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      isActive: plan.isActive,
      isPublic: plan.isPublic,
      prices: priceRows.map((row) => this.mapPrice(row)),
      features: featureRows.map((row) => ({
        id: row.id,
        planFeatureId: row.planFeatureId,
        code: row.code,
        name: row.name,
        description: row.description,
        valueType: row.valueType,
        value: row.value,
        isConfigured: row.planFeatureId !== null,
      })),
      createdAt: new Date(plan.createdAt),
      updatedAt: new Date(plan.updatedAt),
    };
  }

  async listPlans(
    input: ListAdminBillingPlansInput,
  ): Promise<ListAdminBillingPlansResult> {
    const page = Number.isFinite(input.page)
      ? Math.max(1, Math.floor(input.page))
      : 1;

    const limit = Number.isFinite(input.limit)
      ? Math.min(100, Math.max(1, Math.floor(input.limit)))
      : 20;

    const search = input.search?.trim() || null;
    const isActive = input.isActive ?? null;
    const isPublic = input.isPublic ?? null;
    const provider = input.provider ?? null;
    const billingInterval = input.billingInterval ?? null;
    const offset = (page - 1) * limit;

    const filterParameters = [
      search,
      isActive,
      isPublic,
      provider,
      billingInterval,
    ];

    const planRows = await this.dataSource.query<AdminBillingPlanRawRow[]>(
      `
        SELECT
          plan.id AS "id",
          plan.code AS "code",
          plan.name AS "name",
          plan.description AS "description",
          plan.is_active AS "isActive",
          plan.is_public AS "isPublic",
          plan.created_at AS "createdAt",
          plan.updated_at AS "updatedAt"
        FROM billing_plans plan
        WHERE (
          $1::text IS NULL
          OR plan.id::text ILIKE '%' || $1 || '%'
          OR plan.code ILIKE '%' || $1 || '%'
          OR plan.name ILIKE '%' || $1 || '%'
          OR COALESCE(plan.description, '') ILIKE '%' || $1 || '%'
          OR EXISTS (
            SELECT 1
            FROM billing_plan_prices price_search
            WHERE price_search.plan_id = plan.id
              AND (
                price_search.id::text ILIKE '%' || $1 || '%'
                OR COALESCE(price_search.provider_price_id, '')
                  ILIKE '%' || $1 || '%'
              )
          )
        )
        AND (
          $2::boolean IS NULL
          OR plan.is_active = $2
        )
        AND (
          $3::boolean IS NULL
          OR plan.is_public = $3
        )
        AND (
          ($4::text IS NULL AND $5::text IS NULL)
          OR EXISTS (
            SELECT 1
            FROM billing_plan_prices price_filter
            WHERE price_filter.plan_id = plan.id
              AND (
                $4::text IS NULL
                OR price_filter.provider::text = $4
              )
              AND (
                $5::text IS NULL
                OR price_filter.billing_interval::text = $5
              )
          )
        )
        ORDER BY
          CASE UPPER(plan.code)
            WHEN 'FREE' THEN 1
            WHEN 'PLUS' THEN 2
            WHEN 'BUSINESS' THEN 3
            ELSE 100
          END,
          plan.created_at ASC,
          plan.id ASC
        LIMIT $6
        OFFSET $7
      `,
      [...filterParameters, limit, offset],
    );

    const countRows = await this.dataSource.query<
      Array<{ total: number | string }>
    >(
      `
        SELECT COUNT(*) AS total
        FROM billing_plans plan
        WHERE (
          $1::text IS NULL
          OR plan.id::text ILIKE '%' || $1 || '%'
          OR plan.code ILIKE '%' || $1 || '%'
          OR plan.name ILIKE '%' || $1 || '%'
          OR COALESCE(plan.description, '') ILIKE '%' || $1 || '%'
          OR EXISTS (
            SELECT 1
            FROM billing_plan_prices price_search
            WHERE price_search.plan_id = plan.id
              AND (
                price_search.id::text ILIKE '%' || $1 || '%'
                OR COALESCE(price_search.provider_price_id, '')
                  ILIKE '%' || $1 || '%'
              )
          )
        )
        AND (
          $2::boolean IS NULL
          OR plan.is_active = $2
        )
        AND (
          $3::boolean IS NULL
          OR plan.is_public = $3
        )
        AND (
          ($4::text IS NULL AND $5::text IS NULL)
          OR EXISTS (
            SELECT 1
            FROM billing_plan_prices price_filter
            WHERE price_filter.plan_id = plan.id
              AND (
                $4::text IS NULL
                OR price_filter.provider::text = $4
              )
              AND (
                $5::text IS NULL
                OR price_filter.billing_interval::text = $5
              )
          )
        )
      `,
      filterParameters,
    );

    const planIds = planRows.map((plan) => plan.id);

    const priceRows =
      planIds.length === 0
        ? []
        : await this.dataSource.query<AdminBillingPlanPriceRawRow[]>(
            `
              SELECT
                price.id AS "id",
                price.plan_id AS "planId",
                price.billing_interval AS "billingInterval",
                price.currency AS "currency",
                price.amount AS "amount",
                price.provider AS "provider",
                price.provider_price_id AS "providerPriceId",
                price.is_active AS "isActive",
                price.created_at AS "createdAt",
                price.updated_at AS "updatedAt"
              FROM billing_plan_prices price
              WHERE price.plan_id = ANY($1::uuid[])
                AND (
                  $2::text IS NULL
                  OR price.provider::text = $2
                )
                AND (
                  $3::text IS NULL
                  OR price.billing_interval::text = $3
                )
              ORDER BY
                price.plan_id ASC,
                CASE price.billing_interval::text
                  WHEN 'MONTHLY' THEN 1
                  WHEN 'YEARLY' THEN 2
                  ELSE 100
                END,
                CASE price.provider::text
                  WHEN 'STRIPE' THEN 1
                  WHEN 'SEPAY' THEN 2
                  ELSE 100
                END,
                price.created_at ASC
            `,
            [planIds, provider, billingInterval],
          );

    const pricesByPlanId = new Map<string, AdminBillingPlanPriceSummary[]>();

    for (const row of priceRows) {
      const price = this.mapPrice(row);
      const existingPrices = pricesByPlanId.get(row.planId);

      if (existingPrices) {
        existingPrices.push(price);
      } else {
        pricesByPlanId.set(row.planId, [price]);
      }
    }

    const items: AdminBillingPlanSummary[] = planRows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      isActive: row.isActive,
      isPublic: row.isPublic,
      prices: pricesByPlanId.get(row.id) ?? [],
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));

    return {
      items,
      total: Number(countRows[0]?.total ?? 0),
      page,
      limit,
    };
  }

  private mapPrice(
    row: AdminBillingPlanPriceRawRow,
  ): AdminBillingPlanPriceSummary {
    return {
      id: row.id,
      billingInterval: row.billingInterval,
      currency: row.currency,
      amount: Number(row.amount),
      provider: row.provider,
      providerPriceId: row.providerPriceId,
      isActive: row.isActive,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}
