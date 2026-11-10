import { randomUUID } from 'node:crypto';
import { HttpException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { BillingEntitlementService } from '../../../../application/services/billing-entitlement.service';
import { BillingFeatureCode } from '../../../../domain/constants/billing-feature-code.constant';
import { BillingFeatureValueType } from '../../../../domain/constants/billing-feature-value-type.constant';
import { BillingFeature } from '../../../../domain/entities/billing-feature.entity';
import { BillingPlanFeature } from '../../../../domain/entities/billing-plan-feature.entity';
import { BillingPlan } from '../../../../domain/entities/billing-plan.entity';
import { SqlWorkspaceUsageReader } from './sql-workspace-usage-reader.adapter';

const url = process.env.BILLING_LIMIT_TEST_DATABASE_URL;
const describePostgres =
  process.env.RUN_BILLING_LIMIT_PG_E2E === '1' ? describe : describe.skip;

const MEMBER_LIMIT = 3;

describePostgres('Workspace member limit PostgreSQL concurrency', () => {
  const schema = `billing_limit_${randomUUID().replace(/-/g, '')}`;
  const freePlan = BillingPlan.create({
    id: 'plan-free',
    code: 'FREE',
    name: 'Free',
  });
  const memberFeature = BillingFeature.create({
    id: 'feature-members',
    code: BillingFeatureCode.MAX_MEMBERS,
    name: 'Members',
    valueType: BillingFeatureValueType.NUMBER,
  });
  let db: DataSource;
  let entitlements: BillingEntitlementService;

  beforeAll(async () => {
    if (!url) throw new Error('BILLING_LIMIT_TEST_DATABASE_URL is required');
    const databaseName = decodeURIComponent(new URL(url).pathname.slice(1));
    if (!databaseName.endsWith('_test')) {
      throw new Error('Refusing to run against a non-test database');
    }
    db = new DataSource({
      type: 'postgres',
      url,
      synchronize: false,
      migrationsRun: false,
      entities: [],
    });
    await db.initialize();
    await db.query(`CREATE SCHEMA "${schema}"`);
    await db.query(`
      CREATE TABLE "${schema}".workspaces (id uuid PRIMARY KEY);
      CREATE TABLE "${schema}".workspace_members (
        id uuid PRIMARY KEY, workspace_id uuid NOT NULL, membership_type text NOT NULL
      );
      CREATE TABLE "${schema}".workspace_invites (
        id uuid PRIMARY KEY, workspace_id uuid NOT NULL, type text NOT NULL,
        status text NOT NULL, expires_at timestamptz NOT NULL
      );
      CREATE TABLE "${schema}".teamspaces (
        id uuid PRIMARY KEY, workspace_id uuid NOT NULL, deleted_at timestamptz NULL
      );
      CREATE TABLE "${schema}".attachments (
        id uuid PRIMARY KEY, workspace_id uuid NOT NULL, size bigint NOT NULL, status text NOT NULL
      );
      CREATE TABLE "${schema}".ai_generations (
        id uuid PRIMARY KEY, workspace_id uuid NULL, status text NOT NULL, created_at timestamptz NOT NULL
      );
      CREATE TABLE "${schema}".ai_ask_events (
        id uuid PRIMARY KEY, workspace_id uuid NULL, kind text NOT NULL, generation_id uuid NULL,
        status text NOT NULL, created_at timestamptz NOT NULL
      );
    `);
    entitlements = new BillingEntitlementService(
      { findByWorkspaceId: () => Promise.resolve(null) } as never,
      { findByCode: () => Promise.resolve(freePlan) } as never,
      { findAll: () => Promise.resolve([memberFeature]) } as never,
      {
        findByPlanId: () =>
          Promise.resolve([
            BillingPlanFeature.create({
              planId: freePlan.getId(),
              featureId: memberFeature.getId(),
              value: MEMBER_LIMIT,
            }),
          ]),
      } as never,
      new SqlWorkspaceUsageReader(db),
    );
  });

  afterAll(async () => {
    if (db?.isInitialized) {
      await db.query(`DROP SCHEMA "${schema}" CASCADE`);
      await db.destroy();
    }
  });

  async function workspaceWithOneSeatLeft(): Promise<string> {
    const workspaceId = randomUUID();
    await db.query(`INSERT INTO "${schema}".workspaces VALUES ($1)`, [
      workspaceId,
    ]);
    for (const membershipType of ['MEMBER', 'GUEST']) {
      await db.query(
        `INSERT INTO "${schema}".workspace_members VALUES ($1, $2, $3)`,
        [randomUUID(), workspaceId, membershipType],
      );
    }
    await db.query(
      `INSERT INTO "${schema}".workspace_invites VALUES ($1, $2, 'EMAIL', 'PENDING', now() + interval '1 day')`,
      [randomUUID(), workspaceId],
    );
    return workspaceId;
  }

  async function invite(
    workspaceId: string,
    afterCheck: () => Promise<void> = () => Promise.resolve(),
  ): Promise<'invited' | 'blocked'> {
    const tx = db.createQueryRunner();
    await tx.connect();
    await tx.startTransaction();
    try {
      await tx.query(`SET LOCAL search_path TO "${schema}"`);
      await entitlements.assertWithinLimit(
        workspaceId,
        BillingFeatureCode.MAX_MEMBERS,
        1,
        tx.manager,
      );
      await afterCheck();
      await tx.query(
        `INSERT INTO workspace_invites VALUES ($1, $2, 'EMAIL', 'PENDING', now() + interval '1 day')`,
        [randomUUID(), workspaceId],
      );
      await tx.commitTransaction();
      return 'invited';
    } catch (error) {
      if (tx.isTransactionActive) await tx.rollbackTransaction();
      if (error instanceof HttpException && error.getStatus() === 403) {
        return 'blocked';
      }
      throw error;
    } finally {
      await tx.release();
    }
  }

  async function pendingInvites(workspaceId: string): Promise<number> {
    const [row] = await db.query<Array<{ count: number }>>(
      `SELECT COUNT(*)::int AS count FROM "${schema}".workspace_invites WHERE workspace_id = $1`,
      [workspaceId],
    );
    return row.count;
  }

  it('lets only one of two overlapping invites take the last seat', async () => {
    const workspaceId = await workspaceWithOneSeatLeft();
    let releaseFirst!: () => void;
    let firstChecked!: () => void;
    const firstMayInsert = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const firstHasChecked = new Promise<void>((resolve) => {
      firstChecked = resolve;
    });

    const first = invite(workspaceId, async () => {
      firstChecked();
      await firstMayInsert;
    });
    await firstHasChecked;
    const second = invite(workspaceId);
    await new Promise((resolve) => setTimeout(resolve, 300));
    releaseFirst();
    const outcomes = await Promise.all([first, second]);

    expect(outcomes.sort()).toEqual(['blocked', 'invited']);
    expect(await pendingInvites(workspaceId)).toBe(2);
  });

  it('blocks an invite once the seats are full', async () => {
    const workspaceId = await workspaceWithOneSeatLeft();

    expect(await invite(workspaceId)).toBe('invited');
    expect(await invite(workspaceId)).toBe('blocked');
  });
});
