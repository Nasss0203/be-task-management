import { randomUUID } from 'node:crypto';
import { ForbiddenException } from '@nestjs/common';
import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { PageShare } from 'src/modules/content/domain/entities/page-share.entity';
import { PageShareSetting } from 'src/modules/content/domain/entities/page-share-setting.entity';
import { PageShareStatus } from 'src/modules/content/domain/constants/page-share-status.constant';
import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';
import { TypeOrmPageShareRepository } from 'src/modules/content/infrastructure/persistence/typeorm/repositories/typeorm-page-share.repository';
import { TypeOrmPageShareSettingRepository } from 'src/modules/content/infrastructure/persistence/typeorm/repositories/typeorm-page-share-setting.repository';
import { PageShareSettingOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page-share-setting.orm-entity';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { TypeOrmPageSharePermissionReader } from 'src/modules/permission/infrastructure/persistence/typeorm/readers/typeorm-page-share-permission.reader';
import { TypeOrmPageGeneralAccessReader } from 'src/modules/permission/infrastructure/persistence/typeorm/readers/typeorm-page-general-access.reader';
import { PERMISSIONS } from 'src/modules/permission/domain/permissions/permission-code';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import { WorkspaceMembershipType } from 'src/modules/workspace/domain/enums/workspace-membership-type.enum';
import { TeamspaceVisibility } from 'src/modules/workspace/domain/enums/teamspace-visibility.enum';
import { AiGenerationStatus } from '../../../domain/enums/ai-generation-status.enum';
import { AI_MODIFICATION_PLAN_CAPABILITY } from '../../../application/constants/ai-modification-plan.constant';
import { fingerprintAiPageContext } from '../../../application/services/ai-page-context-fingerprint';
import type { AiPageContextResponseDto } from '../../../application/dto/response/ai-page-context.response.dto';
import { ConfirmAiModificationPlanCommand } from '../../../application/commands/confirm-ai-modification-plan/confirm-ai-modification-plan.command';
import { ConfirmAiModificationPlanHandler } from '../../../application/commands/confirm-ai-modification-plan/confirm-ai-modification-plan.handler';
import { AiPageContextTransactionLockService } from './ai-page-context-transaction-lock.service';
import {
  AiPageLockPostgresFixture,
  describePostgres,
} from './ai-page-lock-postgres.fixture';

describePostgres('AI Confirm permission PostgreSQL serialization', () => {
  const fixture = new AiPageLockPostgresFixture();
  const locker = new AiPageContextTransactionLockService();
  let shares: TypeOrmPageShareRepository;
  let settings: TypeOrmPageShareSettingRepository;
  let reader: TypeOrmPageSharePermissionReader;

  beforeAll(async () => {
    await fixture.initialize();
    shares = new TypeOrmPageShareRepository(fixture.source);
    settings = new TypeOrmPageShareSettingRepository(
      fixture.source.getRepository(PageShareSettingOrmEntity),
    );
    reader = new TypeOrmPageSharePermissionReader(fixture.source);
  });
  beforeEach(async () => fixture.reset());
  afterAll(async () => fixture.destroy());

  function share(pageId: string, accessLevel = ResourceAccessLevel.VIEWER) {
    return PageShare.create({
      pageId,
      userId: fixture.userId,
      accessLevel,
      status: PageShareStatus.ACCEPTED,
      createdBy: fixture.creatorId,
    });
  }

  function authorization(generalAccess = false) {
    return new AuthorizationService(
      {
        findMembership: () =>
          Promise.resolve(
            generalAccess
              ? {
                  workspaceId: fixture.workspaceId,
                  userId: fixture.userId,
                  membershipType: WorkspaceMembershipType.MEMBER,
                  role: WorkspaceRole.MEMBER,
                }
              : null,
          ),
      },
      {
        findMembership: () => Promise.resolve(null),
        findTeamspace: () =>
          Promise.resolve({
            id: fixture.teamspaceId,
            workspaceId: fixture.workspaceId,
            visibility: TeamspaceVisibility.PRIVATE,
          }),
      },
      {
        findPageContext: () =>
          Promise.resolve({
            pageId: fixture.pageId,
            workspaceId: fixture.workspaceId,
            teamspaceId: fixture.teamspaceId,
          }),
      } as never,
      reader,
      new TypeOrmPageGeneralAccessReader(fixture.source),
      { authorize: () => Promise.resolve(false) },
    );
  }

  function confirm(
    auth = authorization(),
    execute = jest.fn().mockResolvedValue({}),
  ) {
    const pageContext: AiPageContextResponseDto = {
      schemaVersion: 1,
      builtAt: '2026-10-21T00:00:00.000Z',
      page: {
        id: fixture.pageId,
        workspaceId: fixture.workspaceId,
        teamspaceId: fixture.teamspaceId,
        parentPageId: fixture.ancestorId,
        title: 'Isolated lock fixture',
        icon: null,
        coverUrl: null,
        updatedAt: '2026-10-21T00:00:00.000Z',
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
    const applied = jest.fn().mockResolvedValue({ status: 'APPLIED' });
    const generation = {
      getCapability: () => AI_MODIFICATION_PLAN_CAPABILITY,
      getStatus: () => AiGenerationStatus.COMPLETED,
      getInputData: () => ({
        pageId: fixture.pageId,
        pageContextFingerprint: fingerprintAiPageContext(pageContext),
      }),
      getOutputData: () => ({}),
      getWorkspaceId: () => fixture.workspaceId,
    };
    const handler = new ConfirmAiModificationPlanHandler(
      {
        findByIdAndUserIdForUpdate: () => Promise.resolve(generation),
      } as never,
      auth,
      { execute: () => Promise.resolve(pageContext) } as never,
      {
        validate: () => ({
          status: 'PLAN_READY',
          operations: [{ type: 'INSERT_BLOCKS' }],
        }),
      } as never,
      { execute } as never,
      { execute: applied } as never,
      new TypeOrmUnitOfWork(fixture.source),
      locker,
    );
    return {
      execute,
      applied,
      run: () =>
        handler.execute(
          new ConfirmAiModificationPlanCommand(fixture.userId, randomUUID()),
        ),
    };
  }

  it('reproduces actual FK shape: raw Share INSERT bypasses Page FK locks, Setting INSERT does not', async () => {
    await fixture.holder.startTransaction();
    await fixture.holder.query(
      'SELECT id FROM pages WHERE id = $1 FOR UPDATE',
      [fixture.pageId],
    );
    await fixture.writer.startTransaction();
    try {
      await fixture.writer.query("SET LOCAL lock_timeout = '200ms'");
      await fixture.writer.query(
        `INSERT INTO page_shares(id,page_id,user_id,access_level,status,created_by)
        VALUES ($1,$2,$3,'VIEWER','ACCEPTED',$4)`,
        [randomUUID(), fixture.pageId, fixture.userId, fixture.creatorId],
      );
      await expect(
        fixture.writer.query(
          'INSERT INTO page_share_settings(id,page_id) VALUES ($1,$2)',
          [randomUUID(), fixture.pageId],
        ),
      ).rejects.toMatchObject({ code: '55P03' });
    } finally {
      await fixture.writer.rollbackTransaction();
      await fixture.holder.rollbackTransaction();
    }
  });

  it.each(['direct', 'inherited'] as const)(
    'blocks a new %s Share overriding inherited EDITOR while Confirm holds locks',
    async (target) => {
      await shares.save(share(fixture.rootId, ResourceAccessLevel.EDITOR));
      await fixture.holder.startTransaction();
      await locker.lock(fixture.pageId, fixture.holder.manager, fixture.userId);
      const targetId =
        target === 'direct' ? fixture.pageId : fixture.ancestorId;
      await fixture.expectBlocked((writer) =>
        shares.save(share(targetId), writer.manager),
      );
      expect(
        (await reader.findEffectiveShare(fixture.pageId, fixture.userId))
          ?.accessLevel,
      ).toBe('EDITOR');
      await fixture.holder.rollbackTransaction();
      await shares.save(share(targetId)); // no lock leak; writer now succeeds
      expect(
        (await reader.findEffectiveShare(fixture.pageId, fixture.userId))
          ?.accessLevel,
      ).toBe('VIEWER');
    },
  );

  it.each(['direct', 'inherited'] as const)(
    'blocks restrictive %s Setting INSERT over inherited general access',
    async (target) => {
      const root = PageShareSetting.create({ pageId: fixture.rootId });
      root.setWorkspaceAccessLevel(ResourceAccessLevel.EDITOR);
      await settings.save(root);
      await fixture.holder.startTransaction();
      await locker.lock(fixture.pageId, fixture.holder.manager, fixture.userId);
      await fixture.expectBlocked((writer) =>
        settings.save(
          PageShareSetting.create({
            pageId: target === 'direct' ? fixture.pageId : fixture.ancestorId,
          }),
          writer.manager,
        ),
      );
      await fixture.holder.rollbackTransaction();
    },
  );

  it.each(['update', 'delete'] as const)(
    'blocks inherited Share %s and releases on rollback',
    async (operation) => {
      const inherited = await shares.save(
        share(fixture.rootId, ResourceAccessLevel.EDITOR),
      );
      await fixture.holder.startTransaction();
      await locker.lock(fixture.pageId, fixture.holder.manager, fixture.userId);
      await fixture.expectBlocked(async (writer) => {
        if (operation === 'delete')
          return shares.deleteByPageAndUser(
            fixture.rootId,
            fixture.userId,
            writer.manager,
          );
        inherited.changeAccessLevel(ResourceAccessLevel.VIEWER);
        return shares.save(inherited, writer.manager);
      });
      await fixture.holder.rollbackTransaction();
      const trial = confirm();
      await trial.run();
      expect(trial.applied).toHaveBeenCalledTimes(1);
    },
  );

  it('does not lock permission writes on an unrelated Page in the same workspace', async () => {
    await fixture.holder.startTransaction();
    await locker.lock(fixture.pageId, fixture.holder.manager, fixture.userId);
    await fixture.writer.startTransaction();
    await fixture.writer.query("SET LOCAL lock_timeout = '200ms'");
    await shares.save(share(fixture.unrelatedId), fixture.writer.manager);
    await fixture.writer.rollbackTransaction();
    await fixture.holder.rollbackTransaction();
  });

  it('rejects Confirm when direct VIEWER was committed before authorization', async () => {
    await shares.save(share(fixture.rootId, ResourceAccessLevel.EDITOR));
    await shares.save(share(fixture.pageId));
    const trial = confirm();
    await expect(trial.run()).rejects.toBeInstanceOf(ForbiddenException);
    expect(trial.execute).not.toHaveBeenCalled();
    expect(trial.applied).not.toHaveBeenCalled();
  });

  it.each(['direct', 'inherited'] as const)(
    'waits for an in-flight restrictive %s INSERT before authorization, then forbids Apply',
    async (target) => {
      await shares.save(share(fixture.rootId, ResourceAccessLevel.EDITOR));
      await fixture.writer.startTransaction();
      await shares.save(
        share(target === 'direct' ? fixture.pageId : fixture.ancestorId),
        fixture.writer.manager,
      );
      const auth = authorization();
      const authorized = jest.spyOn(auth, 'authorize');
      const trial = confirm(auth);
      const pending = trial.run().then(
        () => null,
        (error: unknown) => error,
      );
      try {
        await fixture.waitForBlockedWriter();
        expect(authorized).not.toHaveBeenCalled();
        await fixture.writer.commitTransaction();
        expect(await pending).toBeInstanceOf(ForbiddenException);
        expect(trial.execute).not.toHaveBeenCalled();
        expect(trial.applied).not.toHaveBeenCalled();
      } finally {
        if (fixture.writer.isTransactionActive)
          await fixture.writer.rollbackTransaction();
        await pending;
      }
    },
  );

  it('prevents a restrictive insert committing between authorization and Apply', async () => {
    await shares.save(share(fixture.rootId, ResourceAccessLevel.EDITOR));
    let entered!: () => void;
    let resume!: () => void;
    const executing = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      resume = resolve;
    });
    const execute = jest.fn(async () => {
      entered();
      await gate;
      return {};
    });
    const trial = confirm(authorization(), execute);
    const pending = trial.run();
    await executing;
    try {
      await fixture.expectBlocked((writer) =>
        shares.save(share(fixture.pageId), writer.manager),
      );
      expect(
        await authorization().authorize({
          userId: fixture.userId,
          permissions: [PERMISSIONS.PAGE_BLOCK_CREATE],
          target: { type: 'page', id: fixture.pageId },
        }),
      ).toBe(true);
    } finally {
      resume();
      await pending;
    }
    expect(trial.applied).toHaveBeenCalledTimes(1);
    await shares.save(share(fixture.pageId));
    const revoked = confirm();
    await expect(revoked.run()).rejects.toBeInstanceOf(ForbiddenException);
    expect(revoked.applied).not.toHaveBeenCalled();
  });

  it('denies Apply after a restrictive Setting replaces inherited general EDITOR access', async () => {
    const root = PageShareSetting.create({ pageId: fixture.rootId });
    root.setWorkspaceAccessLevel(ResourceAccessLevel.EDITOR);
    await settings.save(root);
    const initial = confirm(authorization(true));
    await initial.run();
    expect(initial.applied).toHaveBeenCalledTimes(1);
    await settings.save(PageShareSetting.create({ pageId: fixture.pageId }));
    const revoked = confirm(authorization(true));
    await expect(revoked.run()).rejects.toBeInstanceOf(ForbiddenException);
    expect(revoked.applied).not.toHaveBeenCalled();
  });

  it('retains existing Share Link, workspace membership and teamspace revocation locks', async () => {
    const linkId = randomUUID();
    const memberId = randomUUID();
    await fixture.source.query(
      'INSERT INTO page_share_links(id,page_id) VALUES ($1,$2)',
      [linkId, fixture.pageId],
    );
    await fixture.source.query(
      `INSERT INTO workspace_members(id,workspace_id,user_id,membership_type,role_name)
      VALUES ($1,$2,$3,'MEMBER','MEMBER')`,
      [memberId, fixture.workspaceId, fixture.userId],
    );
    await fixture.holder.startTransaction();
    await locker.lock(fixture.pageId, fixture.holder.manager, fixture.userId);
    await fixture.expectBlocked((writer) =>
      writer.query('UPDATE page_share_links SET revoked_at=now() WHERE id=$1', [
        linkId,
      ]),
    );
    await fixture.expectBlocked((writer) =>
      writer.query('DELETE FROM workspace_members WHERE id=$1', [memberId]),
    );
    await fixture.expectBlocked((writer) =>
      writer.query('DELETE FROM teamspaces WHERE id=$1', [fixture.teamspaceId]),
    );
    await fixture.holder.rollbackTransaction();
  });

  it.each(['delete', 'downgrade'] as const)(
    'never Applies after inherited permission %s committed before Confirm',
    async (operation) => {
      const inherited = await shares.save(
        share(fixture.rootId, ResourceAccessLevel.EDITOR),
      );
      if (operation === 'delete')
        await shares.deleteByPageAndUser(fixture.rootId, fixture.userId);
      else {
        inherited.changeAccessLevel(ResourceAccessLevel.VIEWER);
        await shares.save(inherited);
      }
      const trial = confirm();
      await expect(trial.run()).rejects.toBeInstanceOf(ForbiddenException);
      expect(trial.execute).not.toHaveBeenCalled();
      expect(trial.applied).not.toHaveBeenCalled();
    },
  );
});
