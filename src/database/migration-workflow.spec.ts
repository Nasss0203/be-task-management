import 'reflect-metadata';

import { createServer } from 'node:net';
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import { execFile, spawnSync } from 'node:child_process';
import { DataSource } from 'typeorm';

import {
  checkpointEvidenceGaps,
  postgresTool,
  loadBaseline,
} from './baseline';
import { GENERAL_VERIFIED_POLICY } from './automatic-checkpoint';
import { readOnlyDataSource } from './migration-safety';
import { AddTemplateListingPreviewMode1792050000000 } from './migrations/1792050000000-AddTemplateListingPreviewMode';
import { runMigrationPrepare } from '../../scripts/migration-prepare';

const execute = promisify(execFile);

async function findUnusedPort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((done, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', done);
  });
  const port = (server.address() as { port: number }).port;
  await new Promise<void>((done, reject) =>
    server.close((err) => (err ? reject(err) : done())),
  );
  return port;
}

describe('Migration Workflow & Safety Architecture', () => {
  describe('Safety & Policy Constraints', () => {
    it('strictly forbids running migration prepare in production', async () => {
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        await expect(runMigrationPrepare()).rejects.toThrow(
          'migration:prepare is strictly prohibited in production',
        );
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });

    it('enforces read-only connection semantics on readOnlyDataSource', async () => {
      const db = readOnlyDataSource({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'task_user',
        password: 'any',
        database: 'test_db',
      });

      expect(db.options.extra).toMatchObject({
        options: '-c default_transaction_read_only=on -c statement_timeout=30000',
      });
    });

    it('validates that loadBaseline includes checkpoint with GENERAL_VERIFIED_POLICY', () => {
      const baseline = loadBaseline();
      const previewModeCheckpoint = baseline.checkpoints.find((cp) =>
        cp.applied.includes('AddTemplateListingPreviewMode1792050000000'),
      );

      expect(previewModeCheckpoint).toBeDefined();
      expect(previewModeCheckpoint?.approval?.policy).toBe(GENERAL_VERIFIED_POLICY);
      expect(previewModeCheckpoint?.schemaSha256).toMatch(/^[a-f0-9]{64}$/);
    });

    it('calculates 0 checkpoint evidence gaps when all active migrations are checkpointed', () => {
      const baseline = loadBaseline();
      const activeNames = [
        'AddPaidTemplateOffer1791810000000',
        'AddTemplateListingPricing1791810001000',
        'CreateTemplatePurchases1791903351862',
        'AddPaidPurchaseEntitlementSource1791958800000',
        'CreateMarketplaceWebhookEvents1791986191301',
        'AddTemplateListingPreviewMode1792050000000',
        'AddTemplateListingDemoPreview1792100000000',
      ];

      const gaps = checkpointEvidenceGaps(activeNames, baseline);
      expect(gaps).toEqual([]);
    });

    it('detects checkpoint evidence gaps when a new uncheckpointed migration is present', () => {
      const baseline = loadBaseline();
      const activeNamesWithUnapproved = [
        'AddPaidTemplateOffer1791810000000',
        'AddTemplateListingPricing1791810001000',
        'CreateTemplatePurchases1791903351862',
        'AddPaidPurchaseEntitlementSource1791958800000',
        'CreateMarketplaceWebhookEvents1791986191301',
        'AddTemplateListingPreviewMode1792050000000',
        'AddTemplateListingDemoPreview1792100000000',
        'FutureUnverifiedMigration1799999999999',
      ];

      const gaps = checkpointEvidenceGaps(activeNamesWithUnapproved, baseline);
      expect(gaps.length).toBe(1);
      expect(gaps[0]).toContain('FutureUnverifiedMigration1799999999999 has no approved schema checkpoint');
    });
  });

  describe('Real PostgreSQL 18 Integration Tests (Isolated Ephemeral Cluster)', () => {
    let root: string;
    let data: string;
    let port: number;
    let db: DataSource;
    let stopped = false;
    let binDir: string;

    beforeAll(async () => {
      root = mkdtempSync(join(tmpdir(), 'taskmanly-spec-pg-'));
      data = join(root, 'data');
      const password = randomBytes(16).toString('hex');
      const passwordFile = join(root, 'password');
      writeFileSync(passwordFile, password, { flag: 'wx', mode: 0o600 });

      binDir = dirname(postgresTool('psql'));
      const exe = (name: string) => join(binDir, `${name}${process.platform === 'win32' ? '.exe' : ''}`);

      port = await findUnusedPort();

      // Initialize cluster
      await execute(exe('initdb'), [
        '-D',
        data,
        '-U',
        'test_runner',
        `--pwfile=${passwordFile}`,
        '--auth=scram-sha-256',
        '--encoding=UTF8',
        '--locale=C',
      ]);

      // Start cluster
      const start = spawnSync(
        exe('pg_ctl'),
        ['-D', data, '-l', join(root, 'server.log'), '-o', `-h 127.0.0.1 -p ${port}`, '-w', '-t', '20', 'start'],
        { stdio: 'ignore', timeout: 25000, windowsHide: true },
      );
      if (start.status !== 0) {
        throw new Error('Failed to start test PostgreSQL instance');
      }

      db = new DataSource({
        type: 'postgres',
        host: '127.0.0.1',
        port,
        username: 'test_runner',
        password,
        database: 'postgres',
        synchronize: false,
        logging: false,
      });

      await db.initialize();
    }, 45000);

    afterAll(async () => {
      if (db?.isInitialized) {
        await db.destroy();
      }
      if (!stopped && existsSync(join(data, 'postmaster.pid'))) {
        const exe = (name: string) => join(binDir, `${name}${process.platform === 'win32' ? '.exe' : ''}`);
        spawnSync(exe('pg_ctl'), ['-D', data, '-m', 'fast', '-w', '-t', '20', 'stop'], {
          stdio: 'ignore',
          timeout: 25000,
          windowsHide: true,
        });
        stopped = true;
      }
      try {
        rmSync(root, { recursive: true, force: true });
      } catch {
        // Temp folder cleanup
      }
    }, 30000);

    it('executes AddTemplateListingPreviewMode migration on real PostgreSQL with enum creation, column addition, and accurate FREE/PAID backfill', async () => {
      // 1. Setup prerequisite table and enum in postgres
      await db.query(`
        CREATE TYPE "public"."template_listings_offer_type_enum" AS ENUM('FREE', 'PAID');
        CREATE TABLE "public"."template_listings" (
          "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
          "title" character varying(255) NOT NULL,
          "offer_type" "public"."template_listings_offer_type_enum" NOT NULL,
          "price_amount" integer NULL
        );
      `);

      // 2. Insert sample legacy listings: 1 FREE and 1 PAID
      const freeId = 'a0000000-0000-0000-0000-000000000001';
      const paidId = 'b0000000-0000-0000-0000-000000000002';

      await db.query(
        `INSERT INTO "public"."template_listings" ("id", "title", "offer_type", "price_amount")
         VALUES ($1, 'Free Template', 'FREE', NULL), ($2, 'Paid Template', 'PAID', 2900)`,
        [freeId, paidId],
      );

      // 3. Run migration up()
      const migration = new AddTemplateListingPreviewMode1792050000000();
      const queryRunner = db.createQueryRunner();
      await queryRunner.connect();

      try {
        await migration.up(queryRunner);

        // 4. Verify enum type created
        const enumValues = await db.query(`
          SELECT enumlabel FROM pg_enum
          JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
          WHERE pg_type.typname = 'template_listings_preview_mode_enum'
          ORDER BY enumsortorder
        `);
        expect(enumValues.map((r: any) => r.enumlabel)).toEqual(['IMAGE', 'INTERACTIVE']);

        // 5. Verify column preview_mode created with NOT NULL and default 'IMAGE'
        const columnInfo = await db.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = 'template_listings' AND column_name = 'preview_mode'
        `);
        expect(columnInfo.length).toBe(1);
        expect(columnInfo[0].is_nullable).toBe('NO');
        expect(columnInfo[0].column_default).toContain("'IMAGE'");

        // 6. Verify backfill correctness: FREE -> INTERACTIVE, PAID -> IMAGE
        const rows = await db.query(`
          SELECT id, title, offer_type, preview_mode FROM "public"."template_listings" ORDER BY offer_type
        `);
        expect(rows.length).toBe(2);

        const freeRow = rows.find((r: any) => r.id === freeId);
        const paidRow = rows.find((r: any) => r.id === paidId);

        expect(freeRow.preview_mode).toBe('INTERACTIVE');
        expect(freeRow.title).toBe('Free Template');

        expect(paidRow.preview_mode).toBe('IMAGE');
        expect(paidRow.title).toBe('Paid Template');

        // 7. Verify migration down() cleans up preview_mode column and enum
        await migration.down(queryRunner);

        const postDownCol = await db.query(`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = 'template_listings' AND column_name = 'preview_mode'
        `);
        expect(postDownCol.length).toBe(0);

        const postDownEnum = await db.query(`
          SELECT typname FROM pg_type WHERE typname = 'template_listings_preview_mode_enum'
        `);
        expect(postDownEnum.length).toBe(0);

        // Verify original rows still exist intact
        const rowsAfterDown = await db.query(`SELECT count(*)::int as count FROM "public"."template_listings"`);
        expect(rowsAfterDown[0].count).toBe(2);
      } finally {
        await queryRunner.release();
      }
    });

    it('rejects invalid migration SQL and ensures transaction rollbacks without partial state', async () => {
      const runner = db.createQueryRunner();
      await runner.connect();
      await runner.startTransaction();

      try {
        await runner.query(`CREATE TABLE "public"."temp_table_roll" ("id" serial PRIMARY KEY)`);
        // Intentionally invalid SQL
        await runner.query(`CREATE INVALID SQL SYNTAX ERROR`);
        await runner.commitTransaction();
      } catch {
        await runner.rollbackTransaction();
      } finally {
        await runner.release();
      }

      // Verify temp_table_roll was completely rolled back
      const tableCheck = await db.query(`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'temp_table_roll'
      `);
      expect(tableCheck.length).toBe(0);
    });
  });
});
