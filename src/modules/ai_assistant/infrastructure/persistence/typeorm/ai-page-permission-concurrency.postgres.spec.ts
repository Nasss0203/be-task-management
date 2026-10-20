import { randomBytes, randomUUID } from 'node:crypto';
import { ForbiddenException } from '@nestjs/common';
import dataSource from 'src/database/data-source';
import { AiGenerationStatus } from '../../../domain/enums/ai-generation-status.enum';
import { AI_MODIFICATION_PLAN_CAPABILITY } from '../../../application/constants/ai-modification-plan.constant';
import { fingerprintAiPageContext } from '../../../application/services/ai-page-context-fingerprint';
import type { AiPageContextResponseDto } from '../../../application/dto/response/ai-page-context.response.dto';
import { ConfirmAiModificationPlanCommand } from '../../../application/commands/confirm-ai-modification-plan/confirm-ai-modification-plan.command';
import { ConfirmAiModificationPlanHandler } from '../../../application/commands/confirm-ai-modification-plan/confirm-ai-modification-plan.handler';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { TypeOrmPageSharePermissionReader } from 'src/modules/permission/infrastructure/persistence/typeorm/readers/typeorm-page-share-permission.reader';
import { TypeOrmPageGeneralAccessReader } from 'src/modules/permission/infrastructure/persistence/typeorm/readers/typeorm-page-general-access.reader';
import type { QueryRunner } from 'typeorm';
import { AiPageContextTransactionLockService } from './ai-page-context-transaction-lock.service';

/**
 * Opt-in: RUN_AI_PAGE_LOCK_PG_E2E=1 npx jest ai-page-permission-concurrency.postgres --runInBand
 *
 * The disposable Page has no shares/links/settings. Temporarily commit test-
 * identified permission records so TWO independent PostgreSQL connections can
 * see and contend over the same rows. Delete only these IDs in afterAll.
 * No Page/PageBlock is mutated. All trial updates of real membership are rolled
 * back. Do not run this suite against a non-disposable Page.
 */
const describePostgres =
  process.env.RUN_AI_PAGE_LOCK_PG_E2E === '1' ? describe : describe.skip;

describePostgres(
  'AI Confirm permission revocation PostgreSQL concurrency',
  () => {
    const pageId = '027228db-8fcb-437e-b6c1-eb276fb44ffe';
    const shareId = randomUUID();
    const linkId = randomUUID();
    const settingId = randomUUID();
    const guestUserId = randomUUID();
    const locker = new AiPageContextTransactionLockService();
    const shareReader = new TypeOrmPageSharePermissionReader(dataSource);
    let holder: QueryRunner;
    let writer: QueryRunner;
    let seeded = false;
    let creatorId: string;
    let workspaceId: string;
    let member: {
      id: string;
      user_id: string;
      membership_type: string;
      role_name: string;
    };
    let originalBlockCount: number;

    beforeAll(async () => {
      await dataSource.initialize();
      const pages = await dataSource.query<
        { id: string; workspace_id: string; created_by: string }[]
      >(
        'SELECT id, workspace_id, created_by FROM pages WHERE id = $1 AND deleted_at IS NULL',
        [pageId],
      );
      if (pages.length !== 1)
        throw new Error('Disposable Phase 5 Page is missing');
      ({ workspace_id: workspaceId, created_by: creatorId } = pages[0]);

      const baseline = await dataSource.query<
        { shares: number; links: number; settings: number; blocks: number }[]
      >(
        `SELECT
         (SELECT COUNT(*)::int FROM page_shares WHERE page_id = $1) AS shares,
         (SELECT COUNT(*)::int FROM page_share_links WHERE page_id = $1) AS links,
         (SELECT COUNT(*)::int FROM page_share_settings WHERE page_id = $1) AS settings,
         (SELECT COUNT(*)::int FROM page_blocks WHERE page_id = $1 AND deleted_at IS NULL) AS blocks`,
        [pageId],
      );
      if (baseline[0].shares || baseline[0].links || baseline[0].settings) {
        throw new Error(
          'Disposable Page permission fixture is not empty; refusing to overwrite it',
        );
      }
      originalBlockCount = baseline[0].blocks;

      const members = await dataSource.query<(typeof member)[]>(
        'SELECT id, user_id, membership_type, role_name FROM workspace_members WHERE workspace_id = $1 ORDER BY id LIMIT 1',
        [workspaceId],
      );
      if (members.length !== 1)
        throw new Error('Disposable Page requires a workspace member');
      member = members[0];

      // Seed + cleanup use their own short transactions. They only touch three
      // test-created permission records on the dedicated disposable Page.
      const setup = dataSource.createQueryRunner();
      await setup.connect();
      try {
        await setup.startTransaction();
        await setup.query(
          `INSERT INTO page_shares (id, page_id, user_id, access_level, status, created_by)
         VALUES ($1, $2, $3, 'EDITOR', 'ACCEPTED', $4)`,
          [shareId, pageId, guestUserId, creatorId],
        );
        await setup.query(
          `INSERT INTO page_share_links (id, page_id, token_hash, created_by)
         VALUES ($1, $2, $3, $4)`,
          [linkId, pageId, randomBytes(32).toString('hex'), creatorId],
        );
        await setup.query(
          `INSERT INTO page_share_settings (id, page_id, workspace_access_level, link_access_level)
         VALUES ($1, $2, NULL, 'EDITOR')`,
          [settingId, pageId],
        );
        await setup.commitTransaction();
        seeded = true;
      } finally {
        if (setup.isTransactionActive) await setup.rollbackTransaction();
        await setup.release();
      }
      holder = dataSource.createQueryRunner();
      writer = dataSource.createQueryRunner();
      await Promise.all([holder.connect(), writer.connect()]);
    });

    afterAll(async () => {
      if (writer?.isTransactionActive) await writer.rollbackTransaction();
      if (holder?.isTransactionActive) await holder.rollbackTransaction();
      if (writer) await writer.release();
      if (holder) await holder.release();
      if (seeded) {
        const cleanup = dataSource.createQueryRunner();
        await cleanup.connect();
        try {
          await cleanup.startTransaction();
          await cleanup.query(
            'DELETE FROM page_share_links WHERE id = $1 AND page_id = $2',
            [linkId, pageId],
          );
          await cleanup.query(
            'DELETE FROM page_share_settings WHERE id = $1 AND page_id = $2',
            [settingId, pageId],
          );
          await cleanup.query(
            'DELETE FROM page_shares WHERE id = $1 AND page_id = $2',
            [shareId, pageId],
          );
          await cleanup.commitTransaction();
        } finally {
          if (cleanup.isTransactionActive) await cleanup.rollbackTransaction();
          await cleanup.release();
        }
        const counts = await dataSource.query<
          { shares: number; links: number; settings: number; blocks: number }[]
        >(
          `SELECT
           (SELECT COUNT(*)::int FROM page_shares WHERE page_id = $1) AS shares,
           (SELECT COUNT(*)::int FROM page_share_links WHERE page_id = $1) AS links,
           (SELECT COUNT(*)::int FROM page_share_settings WHERE page_id = $1) AS settings,
           (SELECT COUNT(*)::int FROM page_blocks WHERE page_id = $1 AND deleted_at IS NULL) AS blocks`,
          [pageId],
        );
        expect(counts[0]).toEqual({
          shares: 0,
          links: 0,
          settings: 0,
          blocks: originalBlockCount,
        });
      }
      if (dataSource.isInitialized) await dataSource.destroy();
    });

    async function expectBlockedWrite(sql: string, params: unknown[]) {
      await writer.startTransaction();
      try {
        await writer.query("SET LOCAL lock_timeout = '300ms'");
        await expect(writer.query(sql, params)).rejects.toMatchObject({
          code: '55P03',
        });
      } finally {
        await writer.rollbackTransaction();
      }
    }

    it('blocks Page Share removal and downgrade while Confirm holds its locks', async () => {
      await holder.startTransaction();
      try {
        await locker.lock(pageId, holder.manager, guestUserId);
        expect(
          (await shareReader.findEffectiveShare(pageId, guestUserId))
            ?.accessLevel,
        ).toBe('EDITOR');
        await expectBlockedWrite('DELETE FROM page_shares WHERE id = $1', [
          shareId,
        ]);
        await expectBlockedWrite(
          "UPDATE page_shares SET access_level = 'VIEWER' WHERE id = $1",
          [shareId],
        );
        expect(
          (await shareReader.findEffectiveShare(pageId, guestUserId))
            ?.accessLevel,
        ).toBe('EDITOR');
      } finally {
        await holder.rollbackTransaction();
      }
      // The writer can update after Confirm rolls back; do not persist this trial.
      await writer.startTransaction();
      try {
        await writer.query("SET LOCAL lock_timeout = '300ms'");
        await writer.query(
          "UPDATE page_shares SET access_level = 'VIEWER' WHERE id = $1",
          [shareId],
        );
      } finally {
        await writer.rollbackTransaction();
      }
    });

    it('serializes Share Link revocation and link-access setting downgrade', async () => {
      await holder.startTransaction();
      try {
        await locker.lock(pageId, holder.manager, guestUserId);
        await expectBlockedWrite(
          'UPDATE page_share_links SET revoked_at = now() WHERE id = $1',
          [linkId],
        );
        await expectBlockedWrite(
          'UPDATE page_share_settings SET link_access_level = NULL WHERE id = $1',
          [settingId],
        );
      } finally {
        await holder.rollbackTransaction();
      }
      const rows = await dataSource.query<{ revoked_at: Date | null }[]>(
        'SELECT revoked_at FROM page_share_links WHERE id = $1',
        [linkId],
      );
      expect(rows[0].revoked_at).toBeNull();
    });

    it('blocks workspace membership revocation without changing the real member', async () => {
      await holder.startTransaction();
      try {
        await locker.lock(pageId, holder.manager, member.user_id);
        await expectBlockedWrite(
          "UPDATE workspace_members SET membership_type = 'GUEST', role_name = NULL WHERE id = $1",
          [member.id],
        );
      } finally {
        await holder.rollbackTransaction();
      }
      const rows = await dataSource.query<
        { membership_type: string; role_name: string }[]
      >(
        'SELECT membership_type, role_name FROM workspace_members WHERE id = $1',
        [member.id],
      );
      expect(rows[0]).toEqual({
        membership_type: member.membership_type,
        role_name: member.role_name,
      });
    });

    it('waits for an uncommitted Page Share revocation and sees rollback', async () => {
      await writer.startTransaction();
      await writer.query(
        "UPDATE page_shares SET status = 'REJECTED' WHERE id = $1",
        [shareId],
      );
      await holder.startTransaction();
      let acquired = false;
      const pending = locker
        .lock(pageId, holder.manager, guestUserId)
        .then(() => {
          acquired = true;
        });
      try {
        await new Promise((resolve) => setTimeout(resolve, 130));
        expect(acquired).toBe(false);
      } finally {
        if (writer.isTransactionActive) await writer.rollbackTransaction();
        await pending;
        await holder.rollbackTransaction();
      }
      expect(acquired).toBe(true);
      expect(
        (await shareReader.findEffectiveShare(pageId, guestUserId))
          ?.accessLevel,
      ).toBe('EDITOR');
    });

    it('re-checks permission after a revocation commits before AI Confirm can proceed', async () => {
      const pageContext: AiPageContextResponseDto = {
        schemaVersion: 1,
        builtAt: '2026-10-20T00:00:00.000Z',
        page: {
          id: pageId,
          workspaceId,
          teamspaceId: null,
          parentPageId: null,
          title: 'Disposable Page',
          icon: null,
          coverUrl: null,
          updatedAt: '2026-10-20T00:00:00.000Z',
        },
        blocks: [],
        databaseReferences: [],
        databases: [],
        completeness: {
          blocks: { total: 0, included: 0, truncated: false },
          databases: { total: 0, included: 0, truncated: false },
          rows: [],
          textTruncated: false,
        },
      };
      const authorization = new AuthorizationService(
        { findMembership: () => Promise.resolve(null) } as never,
        {} as never,
        {
          findPageContext: () =>
            Promise.resolve({
              pageId,
              workspaceId,
              teamspaceId: null,
            }),
        } as never,
        shareReader,
        new TypeOrmPageGeneralAccessReader(dataSource),
        { authorize: () => Promise.resolve(false) } as never,
      );
      const generation = {
        getCapability: () => AI_MODIFICATION_PLAN_CAPABILITY,
        getStatus: () => AiGenerationStatus.COMPLETED,
        getInputData: () => ({
          pageId,
          pageContextFingerprint: fingerprintAiPageContext(pageContext),
        }),
        getOutputData: () => ({}),
        getWorkspaceId: () => workspaceId,
      };
      const authorized = jest.spyOn(authorization, 'authorize');
      const execution = jest.fn();
      const applied = jest.fn();
      const handler = new ConfirmAiModificationPlanHandler(
        {
          findByIdAndUserIdForUpdate: () => Promise.resolve(generation),
        } as never,
        authorization,
        { execute: () => Promise.resolve(pageContext) } as never,
        {
          validate: () => ({
            status: 'PLAN_READY',
            operations: [{ type: 'INSERT_BLOCKS' }],
          }),
        } as never,
        { execute: execution } as never,
        { execute: applied } as never,
        {
          runInTransaction: async (
            fn: (manager: QueryRunner['manager']) => Promise<unknown>,
          ) => {
            const runner = dataSource.createQueryRunner();
            await runner.connect();
            try {
              await runner.startTransaction();
              const result = await fn(runner.manager);
              await runner.commitTransaction();
              return result;
            } catch (error) {
              if (runner.isTransactionActive)
                await runner.rollbackTransaction();
              throw error;
            } finally {
              await runner.release();
            }
          },
        } as never,
        locker,
      );

      await writer.startTransaction();
      await writer.query(
        "UPDATE page_shares SET status = 'REJECTED' WHERE id = $1",
        [shareId],
      );
      const pendingConfirm = handler
        .execute(
          new ConfirmAiModificationPlanCommand(guestUserId, randomUUID()),
        )
        .then(
          () => ({ authorized: true }),
          (error: unknown) => ({ authorized: false, error }),
        );
      let outcome: Awaited<typeof pendingConfirm>;
      try {
        await new Promise((resolve) => setTimeout(resolve, 130));
        expect(authorized).not.toHaveBeenCalled();
        // Simulate the revocation winning the transaction race.
        await writer.commitTransaction();
        outcome = await pendingConfirm;
      } finally {
        if (writer.isTransactionActive) await writer.rollbackTransaction();
      }
      expect(outcome.authorized).toBe(false);
      if (!outcome.authorized)
        expect(outcome.error).toBeInstanceOf(ForbiddenException);
      expect(authorized).toHaveBeenCalled();
      expect(execution).not.toHaveBeenCalled();
      expect(applied).not.toHaveBeenCalled();
      expect(
        await shareReader.findEffectiveShare(pageId, guestUserId),
      ).toBeNull();
    });
  },
);
