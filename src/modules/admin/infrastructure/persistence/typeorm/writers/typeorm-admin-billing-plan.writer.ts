import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type {
  AdminBillingPlanWriter,
  CreateAdminBillingPlanPriceVersionInput,
  UpdateAdminBillingPlanInput,
} from '../../../../application/ports/admin-billing-plan-writer.port';

interface ActiveBillingPlanPriceRow {
  id: string;
  planId: string;
  billingInterval: string;
  currency: string;
  provider: string;
}

@Injectable()
export class TypeOrmAdminBillingPlanWriter implements AdminBillingPlanWriter {
  constructor(private readonly dataSource: DataSource) {}

  async updatePlan(input: UpdateAdminBillingPlanInput): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const updatedPlans = await manager.query<Array<{ id: string }>>(
        `
          UPDATE billing_plans
          SET
            name = $2,
            description = $3,
            is_active = $4,
            is_public = $5,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING id
        `,
        [
          input.planId,
          input.name,
          input.description,
          input.isActive,
          input.isPublic,
        ],
      );

      if (!updatedPlans[0]) {
        return false;
      }

      for (const feature of input.features) {
        await manager.query(
          `
            INSERT INTO billing_plan_features (
              id,
              plan_id,
              feature_id,
              value,
              created_at,
              updated_at
            )
            VALUES (
              uuid_generate_v4(),
              $1,
              $2,
              $3::jsonb,
              CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP
            )
            ON CONFLICT (plan_id, feature_id)
            DO UPDATE SET
              value = EXCLUDED.value,
              updated_at = CURRENT_TIMESTAMP
          `,
          [input.planId, feature.featureId, JSON.stringify(feature.value)],
        );
      }

      return true;
    });
  }

  async createPriceVersion(
    input: CreateAdminBillingPlanPriceVersionInput,
  ): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const priceRows = await manager.query<ActiveBillingPlanPriceRow[]>(
        `
          SELECT
            price.id AS "id",
            price.plan_id AS "planId",
            price.billing_interval AS "billingInterval",
            price.currency AS "currency",
            price.provider AS "provider"
          FROM billing_plan_prices price
          WHERE price.id = $2
            AND price.plan_id = $1
            AND price.is_active = TRUE
          FOR UPDATE
        `,
        [input.planId, input.priceId],
      );

      const currentPrice = priceRows[0];

      if (!currentPrice) {
        return false;
      }

      /*
       * Chỉ giữ một giá active trong cùng một nhóm:
       * plan + provider + interval + currency.
       */
      await manager.query(
        `
          UPDATE billing_plan_prices
          SET
            is_active = FALSE,
            updated_at = CURRENT_TIMESTAMP
          WHERE plan_id = $1
            AND provider::text = $2
            AND billing_interval::text = $3
            AND currency = $4
            AND is_active = TRUE
        `,
        [
          currentPrice.planId,
          currentPrice.provider,
          currentPrice.billingInterval,
          currentPrice.currency,
        ],
      );

      const insertedPrices = await manager.query<Array<{ id: string }>>(
        `
          INSERT INTO billing_plan_prices (
            id,
            plan_id,
            billing_interval,
            currency,
            amount,
            provider,
            provider_price_id,
            is_active,
            created_at,
            updated_at
          )
          VALUES (
            uuid_generate_v4(),
            $1,
            $2,
            $3,
            $4,
            $5,
            NULL,
            TRUE,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
          RETURNING id
        `,
        [
          currentPrice.planId,
          currentPrice.billingInterval,
          currentPrice.currency,
          String(input.amount),
          currentPrice.provider,
        ],
      );

      if (!insertedPrices[0]) {
        return false;
      }

      await manager.query(
        `
          UPDATE billing_plans
          SET updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `,
        [currentPrice.planId],
      );

      return true;
    });
  }
}
