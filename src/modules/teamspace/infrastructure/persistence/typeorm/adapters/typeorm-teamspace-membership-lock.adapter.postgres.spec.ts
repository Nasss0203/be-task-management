import { randomUUID } from 'node:crypto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { TypeOrmTeamspaceOwnershipGuard } from 'src/modules/workspace/infrastructure/persistence/typeorm/adapters/typeorm-teamspace-ownership.guard';
import { TypeOrmTeamspaceMembershipLock } from './typeorm-teamspace-membership-lock.adapter';

const url = process.env.TEAMSPACE_OWNER_TEST_DATABASE_URL;
const describePostgres =
  process.env.RUN_TEAMSPACE_OWNER_PG_E2E === '1' ? describe : describe.skip;

describePostgres('Teamspace role PostgreSQL concurrency', () => {
  const schema = `ts_role_${randomUUID().replace(/-/g, '')}`;
  const lock = new TypeOrmTeamspaceMembershipLock();
  const guard = new TypeOrmTeamspaceOwnershipGuard();
  let db: DataSource;

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
      entities: [],
    });
    await db.initialize();
    await db.query(`CREATE SCHEMA "${schema}"`);
    await db.query(`
      CREATE TABLE "${schema}".workspaces (id uuid PRIMARY KEY);
      CREATE TABLE "${schema}".workspace_members (
        id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES "${schema}".workspaces(id),
        user_id uuid NOT NULL
      );
      CREATE TABLE "${schema}".teamspaces (
        id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES "${schema}".workspaces(id),
        deleted_at timestamptz NULL
      );
      CREATE TABLE "${schema}".teamspace_members (
        id uuid PRIMARY KEY, teamspace_id uuid NOT NULL REFERENCES "${schema}".teamspaces(id) ON DELETE CASCADE,
        workspace_member_id uuid NOT NULL REFERENCES "${schema}".workspace_members(id) ON DELETE CASCADE,
        role_name text NOT NULL
      );
    `);
  });

  afterAll(async () => {
    if (db?.isInitialized) {
      await db.query(`DROP SCHEMA "${schema}" CASCADE`);
      await db.destroy();
    }
  });

  async function fixture(roles: string[]) {
    const workspaceId = randomUUID();
    const teamspaceId = randomUUID();
    await db.query(`INSERT INTO "${schema}".workspaces VALUES ($1)`, [
      workspaceId,
    ]);
    await db.query(`INSERT INTO "${schema}".teamspaces VALUES ($1, $2, NULL)`, [
      teamspaceId,
      workspaceId,
    ]);
    const people: Array<{
      memberId: string;
      userId: string;
      teamspaceMemberId: string;
    }> = [];
    for (const role of roles) {
      const memberId = randomUUID();
      const userId = randomUUID();
      const teamspaceMemberId = randomUUID();
      await db.query(
        `INSERT INTO "${schema}".workspace_members VALUES ($1, $2, $3)`,
        [memberId, workspaceId, userId],
      );
      await db.query(
        `INSERT INTO "${schema}".teamspace_members VALUES ($1, $2, $3, $4)`,
        [teamspaceMemberId, teamspaceId, memberId, role],
      );
      people.push({ memberId, userId, teamspaceMemberId });
    }
    return { workspaceId, teamspaceId, people };
  }

  async function runner(): Promise<QueryRunner> {
    const tx = db.createQueryRunner();
    await tx.connect();
    await tx.startTransaction();
    await tx.query(`SET LOCAL search_path TO "${schema}"`);
    return tx;
  }

  async function ownerCount(teamspaceId: string): Promise<number> {
    const [row] = await db.query<Array<{ count: number }>>(
      `SELECT COUNT(*)::int AS count FROM "${schema}".teamspace_members WHERE teamspace_id = $1 AND role_name = 'OWNER'`,
      [teamspaceId],
    );
    return row.count;
  }

  async function changeRole(
    teamspaceId: string,
    target: { memberId: string; userId: string },
    actorUserId: string,
    nextRole: string,
  ): Promise<'changed' | 'blocked'> {
    const tx = await runner();
    try {
      await lock.lockForMembershipChange(
        target.memberId,
        teamspaceId,
        actorUserId,
        tx.manager,
      );
      const [current] = await tx.query<Array<{ role_name: string }>>(
        `SELECT role_name FROM teamspace_members WHERE teamspace_id = $1 AND workspace_member_id = $2`,
        [teamspaceId, target.memberId],
      );
      if (current.role_name === 'OWNER' && nextRole === 'MEMBER') {
        const [row] = await tx.query<Array<{ count: number }>>(
          `SELECT COUNT(*)::int AS count FROM teamspace_members WHERE teamspace_id = $1 AND role_name = 'OWNER'`,
          [teamspaceId],
        );
        if (row.count <= 1) throw new ConflictException('last owner');
      }
      await tx.query(
        `UPDATE teamspace_members SET role_name = $1 WHERE teamspace_id = $2 AND workspace_member_id = $3`,
        [nextRole, teamspaceId, target.memberId],
      );
      await tx.commitTransaction();
      return 'changed';
    } catch (error) {
      if (tx.isTransactionActive) await tx.rollbackTransaction();
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      )
        return 'blocked';
      throw error;
    } finally {
      await tx.release();
    }
  }

  async function remove(
    workspaceId: string,
    targetMemberId: string,
  ): Promise<'removed' | 'blocked'> {
    const tx = await runner();
    try {
      await guard.assertCanRemoveWorkspaceMember(
        workspaceId,
        targetMemberId,
        tx.manager,
      );
      await tx.query(`DELETE FROM workspace_members WHERE id = $1`, [
        targetMemberId,
      ]);
      await tx.commitTransaction();
      return 'removed';
    } catch (error) {
      if (tx.isTransactionActive) await tx.rollbackTransaction();
      if (error instanceof ConflictException) return 'blocked';
      throw error;
    } finally {
      await tx.release();
    }
  }

  it('serializes two owner demotions', async () => {
    const { teamspaceId, people } = await fixture(['OWNER', 'OWNER']);
    const outcomes = await Promise.all(
      people.map((person) =>
        changeRole(teamspaceId, person, person.userId, 'MEMBER'),
      ),
    );
    expect(outcomes.sort()).toEqual(['blocked', 'changed']);
    expect(await ownerCount(teamspaceId)).toBe(1);
  });

  it('serializes a workspace removal against a different owner demotion', async () => {
    const { workspaceId, teamspaceId, people } = await fixture([
      'OWNER',
      'OWNER',
    ]);
    const outcomes = await Promise.all([
      remove(workspaceId, people[0].memberId),
      changeRole(teamspaceId, people[1], people[1].userId, 'MEMBER'),
    ]);
    expect(outcomes).toContain('blocked');
    expect(await ownerCount(teamspaceId)).toBe(1);
  });

  it('serializes promotion against removal of the promoted WorkspaceMember', async () => {
    const { workspaceId, teamspaceId, people } = await fixture([
      'OWNER',
      'MEMBER',
    ]);
    const outcomes = await Promise.all([
      changeRole(teamspaceId, people[1], people[0].userId, 'OWNER'),
      remove(workspaceId, people[1].memberId),
    ]);
    expect(outcomes).toContain('removed');
    expect(await ownerCount(teamspaceId)).toBeGreaterThanOrEqual(1);
  });

  it('rolls back a last-owner demotion', async () => {
    const { teamspaceId, people } = await fixture(['OWNER']);
    expect(
      await changeRole(teamspaceId, people[0], people[0].userId, 'MEMBER'),
    ).toBe('blocked');
    expect(await ownerCount(teamspaceId)).toBe(1);
  });

  it('keeps the Teamspace lock on the supplied transaction', async () => {
    const { teamspaceId, people } = await fixture(['OWNER']);
    const holder = await runner();
    const writer = await runner();
    try {
      await lock.lockForMembershipChange(
        people[0].memberId,
        teamspaceId,
        people[0].userId,
        holder.manager,
      );
      await writer.query(`SET LOCAL lock_timeout = '200ms'`);
      await expect(
        writer.query(
          `UPDATE teamspaces SET deleted_at = deleted_at WHERE id = $1`,
          [teamspaceId],
        ),
      ).rejects.toMatchObject({ code: '55P03' });
    } finally {
      await holder.rollbackTransaction();
      await writer.rollbackTransaction();
      await holder.release();
      await writer.release();
    }
  });
});
