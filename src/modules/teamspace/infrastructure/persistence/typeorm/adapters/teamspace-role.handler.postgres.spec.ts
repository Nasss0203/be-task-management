import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { DATABASE_ENTITIES } from 'src/database/entities';
import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { AddTeamspaceMemberHandler } from 'src/modules/teamspace/application/commands/teamspace/add-teamspace-member/add-teamspace-member.handler';
import { AddTeamspaceMemberCommand } from 'src/modules/teamspace/application/commands/teamspace/add-teamspace-member/add-teamspace-member.command';
import { UpdateTeamspaceMemberRoleHandler } from 'src/modules/teamspace/application/commands/teamspace/update-teamspace-member-role/update-teamspace-member-role.handler';
import { UpdateTeamspaceMemberRoleCommand } from 'src/modules/teamspace/application/commands/teamspace/update-teamspace-member-role/update-teamspace-member-role.command';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import { TeamspaceOrmEntity } from '../entities/teamspace.orm-entity';
import { TeamspaceMemberOrmEntity } from '../entities/teamspace-member.orm-entity';
import { TypeOrmTeamspaceRepository } from '../repositories/typeorm-teamspace.repository';
import { TypeOrmTeamspaceMemberRepository } from '../repositories/typeorm-teamspace-member.repository';
import { WorkspaceMemberOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace-member.orm-entity';
import { TypeOrmWorkspaceMemberRepository } from 'src/modules/workspace/infrastructure/persistence/typeorm/repositories/typeorm-workspace-member.repository';
import { TypeOrmTeamspaceOwnershipGuard } from 'src/modules/workspace/infrastructure/persistence/typeorm/adapters/typeorm-teamspace-ownership.guard';
import { TypeOrmTeamspaceMembershipLock } from './typeorm-teamspace-membership-lock.adapter';

const url = process.env.TEAMSPACE_OWNER_TEST_DATABASE_URL;
const describePostgres =
  process.env.RUN_TEAMSPACE_OWNER_PG_E2E === '1' ? describe : describe.skip;

describePostgres('Teamspace handlers with real PostgreSQL transactions', () => {
  const schema = `ts_handler_${randomUUID().replace(/-/g, '')}`;
  let db: DataSource;
  let uow: TypeOrmUnitOfWork;
  let roleHandler: UpdateTeamspaceMemberRoleHandler;
  let addHandler: AddTeamspaceMemberHandler;
  const guard = new TypeOrmTeamspaceOwnershipGuard();
  const authorize = jest.fn().mockResolvedValue(true);

  beforeAll(async () => {
    if (!url) throw new Error('TEAMSPACE_OWNER_TEST_DATABASE_URL is required');
    const databaseName = decodeURIComponent(new URL(url).pathname.slice(1));
    if (!databaseName.endsWith('_test') || databaseName === 'task_manly_v2') {
      throw new Error('Refusing to run against a non-test database');
    }
    db = new DataSource({
      type: 'postgres',
      url,
      synchronize: false,
      migrationsRun: false,
      entities: DATABASE_ENTITIES,
    });
    await db.initialize();
    await db.query(`CREATE SCHEMA "${schema}"`);
    await db.query(`
      CREATE TABLE "${schema}".workspaces (id uuid PRIMARY KEY);
      CREATE TABLE "${schema}".workspace_members (
        id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES "${schema}".workspaces(id), user_id uuid NOT NULL,
        membership_type text NOT NULL, role_name text, joined_at timestamptz NOT NULL,
        last_opened_at timestamptz NULL
      );
      CREATE TABLE "${schema}".teamspaces (
        id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES "${schema}".workspaces(id), name text NOT NULL,
        slug text NOT NULL, description text, icon text, visibility text NOT NULL,
        created_by uuid NOT NULL, created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL, deleted_at timestamptz, deleted_by uuid
      );
      CREATE TABLE "${schema}".teamspace_members (
        id uuid PRIMARY KEY, teamspace_id uuid NOT NULL REFERENCES "${schema}".teamspaces(id) ON DELETE CASCADE,
        workspace_member_id uuid NOT NULL REFERENCES "${schema}".workspace_members(id) ON DELETE CASCADE, role_name text NOT NULL,
        joined_at timestamptz NOT NULL, created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL
      );
    `);
    uow = new TypeOrmUnitOfWork(db);
    const teamspaceRepo = new TypeOrmTeamspaceRepository(
      db.getRepository(TeamspaceOrmEntity),
    );
    const memberRepo = new TypeOrmTeamspaceMemberRepository(
      db.getRepository(TeamspaceMemberOrmEntity),
    );
    const workspaceMemberRepo = new TypeOrmWorkspaceMemberRepository(
      db.getRepository(WorkspaceMemberOrmEntity),
      db,
    );
    const lock = new TypeOrmTeamspaceMembershipLock();
    const authorization = { authorize } as any;
    roleHandler = new UpdateTeamspaceMemberRoleHandler(
      teamspaceRepo,
      memberRepo,
      workspaceMemberRepo,
      lock,
      uow,
      authorization,
    );
    addHandler = new AddTeamspaceMemberHandler(
      teamspaceRepo,
      memberRepo,
      workspaceMemberRepo,
      lock,
      uow,
      authorization,
    );
  });

  afterAll(async () => {
    if (db?.isInitialized) {
      await db.query(`DROP SCHEMA "${schema}" CASCADE`);
      await db.destroy();
    }
  });

  beforeEach(() => authorize.mockResolvedValue(true));

  async function fixture(roles: Array<TeamspaceRole | null>) {
    const workspaceId = randomUUID();
    const teamspaceId = randomUUID();
    await db.query(`INSERT INTO "${schema}".workspaces VALUES ($1)`, [
      workspaceId,
    ]);
    await db.query(
      `INSERT INTO "${schema}".teamspaces VALUES ($1,$2,'Teamspace','teamspace',NULL,NULL,'OPEN',$3,now(),now(),NULL,NULL)`,
      [teamspaceId, workspaceId, randomUUID()],
    );
    const people: Array<{
      memberId: string;
      userId: string;
      teamspaceMemberId: string | null;
    }> = [];
    for (const role of roles) {
      const memberId = randomUUID();
      const userId = randomUUID();
      const teamspaceMemberId = role ? randomUUID() : null;
      await db.query(
        `INSERT INTO "${schema}".workspace_members VALUES ($1,$2,$3,'MEMBER','MEMBER',now(),NULL)`,
        [memberId, workspaceId, userId],
      );
      if (role) {
        await db.query(
          `INSERT INTO "${schema}".teamspace_members VALUES ($1,$2,$3,$4,now(),now(),now())`,
          [teamspaceMemberId, teamspaceId, memberId, role],
        );
      }
      people.push({ memberId, userId, teamspaceMemberId });
    }
    return { workspaceId, teamspaceId, people };
  }

  async function inSchema<T>(fn: () => Promise<T>): Promise<T> {
    return uow.runInTransaction(async (context) => {
      await (context as EntityManager).query(
        `SET LOCAL search_path TO "${schema}"`,
      );
      return fn();
    });
  }

  async function changeRole(
    teamspaceId: string,
    target: { teamspaceMemberId: string | null },
    actorUserId: string,
    role: TeamspaceRole,
  ) {
    return inSchema(() =>
      roleHandler.execute(
        new UpdateTeamspaceMemberRoleCommand(
          teamspaceId,
          target.teamspaceMemberId!,
          role,
          actorUserId,
        ),
      ),
    );
  }

  async function remove(workspaceId: string, memberId: string) {
    return inSchema(() =>
      uow.runInTransaction(async (context) => {
        await guard.assertCanRemoveWorkspaceMember(
          workspaceId,
          memberId,
          context,
        );
        await (context as EntityManager).query(
          `DELETE FROM workspace_members WHERE id = $1`,
          [memberId],
        );
      }),
    );
  }

  async function ownerCount(teamspaceId: string): Promise<number> {
    const [row] = await db.query<Array<{ count: number }>>(
      `SELECT COUNT(*)::int AS count FROM "${schema}".teamspace_members WHERE teamspace_id = $1 AND role_name = 'OWNER'`,
      [teamspaceId],
    );
    return row.count;
  }

  it('serializes concurrent demotions through the real handler and repositories', async () => {
    const { teamspaceId, people } = await fixture([
      TeamspaceRole.OWNER,
      TeamspaceRole.OWNER,
    ]);
    const results = await Promise.allSettled(
      people.map((person) =>
        changeRole(teamspaceId, person, person.userId, TeamspaceRole.MEMBER),
      ),
    );
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
    expect(await ownerCount(teamspaceId)).toBe(1);
  });

  it('serializes WorkspaceMember removal against demotion', async () => {
    const { workspaceId, teamspaceId, people } = await fixture([
      TeamspaceRole.OWNER,
      TeamspaceRole.OWNER,
    ]);
    const results = await Promise.allSettled([
      remove(workspaceId, people[0].memberId),
      changeRole(
        teamspaceId,
        people[1],
        people[1].userId,
        TeamspaceRole.MEMBER,
      ),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(await ownerCount(teamspaceId)).toBe(1);
  });

  it('keeps an owner when promotion races with target removal', async () => {
    const { workspaceId, teamspaceId, people } = await fixture([
      TeamspaceRole.OWNER,
      TeamspaceRole.MEMBER,
    ]);
    await Promise.allSettled([
      changeRole(teamspaceId, people[1], people[0].userId, TeamspaceRole.OWNER),
      remove(workspaceId, people[1].memberId),
    ]);
    expect(await ownerCount(teamspaceId)).toBeGreaterThanOrEqual(1);
  });

  it('rolls back a last-owner demotion', async () => {
    const { teamspaceId, people } = await fixture([TeamspaceRole.OWNER]);
    await expect(
      changeRole(
        teamspaceId,
        people[0],
        people[0].userId,
        TeamspaceRole.MEMBER,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(await ownerCount(teamspaceId)).toBe(1);
  });

  it('denies Add Member after the actor is demoted despite earlier authorization', async () => {
    const { teamspaceId, people } = await fixture([
      TeamspaceRole.OWNER,
      TeamspaceRole.OWNER,
      null,
    ]);
    let release!: () => void;
    let started!: () => void;
    const entered = new Promise<void>((resolve) => {
      started = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    authorize.mockImplementation(async ({ userId }: { userId: string }) => {
      if (userId === people[0].userId) {
        started();
        await gate;
      }
      return true;
    });
    const add = inSchema(() =>
      addHandler.execute(
        new AddTeamspaceMemberCommand(
          teamspaceId,
          people[2].memberId,
          TeamspaceRole.OWNER,
          people[0].userId,
        ),
      ),
    );
    await entered;
    await changeRole(
      teamspaceId,
      people[0],
      people[1].userId,
      TeamspaceRole.MEMBER,
    );
    release();
    await expect(add).rejects.toBeInstanceOf(ForbiddenException);
  });

  it.each([false, true])(
    'rejects an actor removed during locking (re-created: %s)',
    async (recreate) => {
      const { workspaceId, teamspaceId, people } = await fixture([
        TeamspaceRole.OWNER,
        TeamspaceRole.OWNER,
        TeamspaceRole.MEMBER,
      ]);
      let release!: () => void;
      let started!: () => void;
      const entered = new Promise<void>((resolve) => {
        started = resolve;
      });
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const pending = inSchema(async () =>
        uow.runInTransaction(async (context) => {
          const manager = context as EntityManager;
          const original = manager.query.bind(manager);
          let paused = false;
          (manager as any).query = async (sql: string, params?: unknown[]) => {
            const rows = await original(sql, params);
            if (
              !paused &&
              sql.includes('FROM workspace_members WHERE workspace_id') &&
              sql.includes('user_id')
            ) {
              paused = true;
              started();
              await gate;
            }
            return rows;
          };
          try {
            await new TypeOrmTeamspaceMembershipLock().lockForMembershipChange(
              people[2].memberId,
              teamspaceId,
              people[0].userId,
              context,
            );
          } finally {
            (manager as any).query = original;
          }
        }),
      );
      await entered;
      await remove(workspaceId, people[0].memberId);
      if (recreate) {
        await db.query(
          `INSERT INTO "${schema}".workspace_members VALUES ($1,$2,$3,'MEMBER','MEMBER',now(),NULL)`,
          [randomUUID(), workspaceId, people[0].userId],
        );
      }
      release();
      await expect(pending).rejects.toBeInstanceOf(ForbiddenException);
    },
  );
});
