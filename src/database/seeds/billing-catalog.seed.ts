import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { randomUUID } from 'crypto';
import { DataSource, EntityManager } from 'typeorm';

import { AppModule } from '../../app.module';

type PlanCode = 'FREE' | 'PLUS' | 'BUSINESS';

type FeatureCode =
  | 'MAX_MEMBERS'
  | 'MAX_TEAMSPACES'
  | 'MAX_STORAGE_MB'
  | 'PUBLIC_PAGE';

type FeatureValue = number | boolean;

type IdRow = {
  id: string;
};

const plans = [
  {
    code: 'FREE',
    name: 'Free',
    description: 'For individuals and small teams getting started.',
  },
  {
    code: 'PLUS',
    name: 'Plus',
    description: 'For growing teams that need higher usage limits.',
  },
  {
    code: 'BUSINESS',
    name: 'Business',
    description: 'For larger teams that need expanded capacity.',
  },
] satisfies Array<{
  code: PlanCode;
  name: string;
  description: string;
}>;

const features = [
  {
    code: 'MAX_MEMBERS',
    name: 'Maximum members',
    description: 'Maximum number of members in a workspace.',
    valueType: 'NUMBER',
  },
  {
    code: 'MAX_TEAMSPACES',
    name: 'Maximum teamspaces',
    description: 'Maximum number of teamspaces in a workspace.',
    valueType: 'NUMBER',
  },
  {
    code: 'MAX_STORAGE_MB',
    name: 'Maximum storage',
    description: 'Maximum storage capacity measured in megabytes.',
    valueType: 'NUMBER',
  },
  {
    code: 'PUBLIC_PAGE',
    name: 'Public page',
    description: 'Allows workspace pages to be published publicly.',
    valueType: 'BOOLEAN',
  },
] satisfies Array<{
  code: FeatureCode;
  name: string;
  description: string;
  valueType: 'NUMBER' | 'BOOLEAN';
}>;

const planFeatures = [
  {
    planCode: 'FREE',
    featureCode: 'MAX_MEMBERS',
    value: 5,
  },
  {
    planCode: 'FREE',
    featureCode: 'MAX_TEAMSPACES',
    value: 1,
  },
  {
    planCode: 'FREE',
    featureCode: 'MAX_STORAGE_MB',
    value: 500,
  },
  {
    planCode: 'FREE',
    featureCode: 'PUBLIC_PAGE',
    value: false,
  },

  {
    planCode: 'PLUS',
    featureCode: 'MAX_MEMBERS',
    value: 25,
  },
  {
    planCode: 'PLUS',
    featureCode: 'MAX_TEAMSPACES',
    value: 10,
  },
  {
    planCode: 'PLUS',
    featureCode: 'MAX_STORAGE_MB',
    value: 10000,
  },
  {
    planCode: 'PLUS',
    featureCode: 'PUBLIC_PAGE',
    value: true,
  },

  {
    planCode: 'BUSINESS',
    featureCode: 'MAX_MEMBERS',
    value: 100,
  },
  {
    planCode: 'BUSINESS',
    featureCode: 'MAX_TEAMSPACES',
    value: 50,
  },
  {
    planCode: 'BUSINESS',
    featureCode: 'MAX_STORAGE_MB',
    value: 100000,
  },
  {
    planCode: 'BUSINESS',
    featureCode: 'PUBLIC_PAGE',
    value: true,
  },
] satisfies Array<{
  planCode: PlanCode;
  featureCode: FeatureCode;
  value: FeatureValue;
}>;

const prices = [
  {
    planCode: 'PLUS',
    billingInterval: 'MONTHLY',
    currency: 'VND',
    amount: 99000,
    provider: 'SEPAY',
  },
  {
    planCode: 'PLUS',
    billingInterval: 'YEARLY',
    currency: 'VND',
    amount: 990000,
    provider: 'SEPAY',
  },
  {
    planCode: 'BUSINESS',
    billingInterval: 'MONTHLY',
    currency: 'VND',
    amount: 249000,
    provider: 'SEPAY',
  },
  {
    planCode: 'BUSINESS',
    billingInterval: 'YEARLY',
    currency: 'VND',
    amount: 2490000,
    provider: 'SEPAY',
  },
] satisfies Array<{
  planCode: Exclude<PlanCode, 'FREE'>;
  billingInterval: 'MONTHLY' | 'YEARLY';
  currency: 'VND';
  amount: number;
  provider: 'SEPAY';
}>;

async function upsertPlan(
  manager: EntityManager,
  definition: (typeof plans)[number],
): Promise<string> {
  const rows: IdRow[] = await manager.query(
    `
      INSERT INTO "billing_plans" (
        "id",
        "code",
        "name",
        "description",
        "is_active",
        "is_public",
        "created_at",
        "updated_at"
      )
      VALUES ($1, $2, $3, $4, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("code")
      DO UPDATE SET
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "is_active" = true,
        "is_public" = true,
        "updated_at" = CURRENT_TIMESTAMP
      RETURNING "id"
    `,
    [randomUUID(), definition.code, definition.name, definition.description],
  );

  const id = rows[0]?.id;

  if (!id) {
    throw new Error(`Could not seed billing plan: ${definition.code}`);
  }

  return id;
}

async function upsertFeature(
  manager: EntityManager,
  definition: (typeof features)[number],
): Promise<string> {
  const rows: IdRow[] = await manager.query(
    `
      INSERT INTO "billing_features" (
        "id",
        "code",
        "name",
        "description",
        "value_type",
        "created_at",
        "updated_at"
      )
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("code")
      DO UPDATE SET
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "value_type" = EXCLUDED."value_type",
        "updated_at" = CURRENT_TIMESTAMP
      RETURNING "id"
    `,
    [
      randomUUID(),
      definition.code,
      definition.name,
      definition.description,
      definition.valueType,
    ],
  );

  const id = rows[0]?.id;

  if (!id) {
    throw new Error(`Could not seed billing feature: ${definition.code}`);
  }

  return id;
}

async function upsertPlanFeature(
  manager: EntityManager,
  planId: string,
  featureId: string,
  value: FeatureValue,
): Promise<void> {
  await manager.query(
    `
      INSERT INTO "billing_plan_features" (
        "id",
        "plan_id",
        "feature_id",
        "value",
        "created_at",
        "updated_at"
      )
      VALUES (
        $1,
        $2,
        $3,
        $4::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("plan_id", "feature_id")
      DO UPDATE SET
        "value" = EXCLUDED."value",
        "updated_at" = CURRENT_TIMESTAMP
    `,
    [randomUUID(), planId, featureId, JSON.stringify(value)],
  );
}

async function upsertPrice(
  manager: EntityManager,
  planId: string,
  definition: (typeof prices)[number],
): Promise<void> {
  const existingRows: IdRow[] = await manager.query(
    `
      SELECT "id"
      FROM "billing_plan_prices"
      WHERE "plan_id" = $1
        AND "billing_interval" = $2
        AND "currency" = $3
        AND "provider" = $4
      ORDER BY "created_at" ASC
      LIMIT 1
    `,
    [
      planId,
      definition.billingInterval,
      definition.currency,
      definition.provider,
    ],
  );

  const existingId = existingRows[0]?.id;

  if (existingId) {
    await manager.query(
      `
        UPDATE "billing_plan_prices"
        SET
          "amount" = $2,
          "provider_price_id" = NULL,
          "is_active" = true,
          "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = $1
      `,
      [existingId, definition.amount.toString()],
    );

    return;
  }

  await manager.query(
    `
      INSERT INTO "billing_plan_prices" (
        "id",
        "plan_id",
        "billing_interval",
        "currency",
        "amount",
        "provider",
        "provider_price_id",
        "is_active",
        "created_at",
        "updated_at"
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        NULL,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `,
    [
      randomUUID(),
      planId,
      definition.billingInterval,
      definition.currency,
      definition.amount.toString(),
      definition.provider,
    ],
  );
}

function getRequiredId<T extends string>(ids: Map<T, string>, code: T): string {
  const id = ids.get(code);

  if (!id) {
    throw new Error(`Missing seeded identifier for: ${code}`);
  }

  return id;
}

async function seedBillingCatalog(): Promise<void> {
  const logger = new Logger('BillingCatalogSeed');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const dataSource = app.get(DataSource);

    await dataSource.transaction(async (manager) => {
      const planIds = new Map<PlanCode, string>();
      const featureIds = new Map<FeatureCode, string>();

      for (const plan of plans) {
        planIds.set(plan.code, await upsertPlan(manager, plan));
      }

      for (const feature of features) {
        featureIds.set(feature.code, await upsertFeature(manager, feature));
      }

      for (const planFeature of planFeatures) {
        await upsertPlanFeature(
          manager,
          getRequiredId(planIds, planFeature.planCode),
          getRequiredId(featureIds, planFeature.featureCode),
          planFeature.value,
        );
      }

      for (const price of prices) {
        await upsertPrice(
          manager,
          getRequiredId(planIds, price.planCode),
          price,
        );
      }
    });

    logger.log('Billing catalog seeded successfully.');
  } finally {
    await app.close();
  }
}

void seedBillingCatalog().catch((error: unknown) => {
  const logger = new Logger('BillingCatalogSeed');

  logger.error(
    error instanceof Error ? (error.stack ?? error.message) : String(error),
  );

  process.exitCode = 1;
});
