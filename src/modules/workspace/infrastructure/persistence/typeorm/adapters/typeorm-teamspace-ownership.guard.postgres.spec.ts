import { randomUUID } from 'node:crypto';
import { ConflictException } from '@nestjs/common';
import { DataSource, type QueryRunner } from 'typeorm';
import { TypeOrmTeamspaceOwnershipGuard } from './typeorm-teamspace-ownership.guard';

const connectionUrl = process.env.TEAMSPACE_OWNER_TEST_DATABASE_URL;
const describePostgres =
  process.env.RUN_TEAMSPACE_OWNER_PG_E2E === '1' ? describe : describe.skip;

describePostgres('Teamspace last-owner PostgreSQL locking', () => {
  const guard = new TypeOrmTeamspaceOwnershipGuard();
  const schema = `ts_owner_${randomUUID().replace(/-/g, '')}`;
  let dataSource: DataSource;

  beforeAll(async () => {
    if (!connectionUrl) throw new Error('TEAMSPACE_OWNER_TEST_DATABASE_URL is required');
    const databaseName = decodeURIComponent(new URL(connectionUrl).pathname.slice(1));
    if (!databaseName.endsWith('_test') || databaseName === 'task_manly_v2') {
      throw new Error('Refusing to run against a non-test database');
    }
    dataSource = new DataSource({
      type: 'postgres',
      url: connectionUrl,
      synchronize: false,
      migrationsRun: false,
      entities: [],
    });
    await dataSource.initialize();
    await dataSource.query(`CREATE SCHEMA "${schema}"`);
    await dataSource.query(`
      CREATE TABLE "${schema}".workspaces (id uuid PRIMARY KEY);
      CREATE TABLE "${schema}".workspace_members (
        id uuid PRIMARY KEY,
        workspace_id uuid NOT NULL REFERENCES "${schema}".workspaces(id)
      );
      CREATE TABLE "${schema}".teamspaces (
        id uuid PRIMARY KEY,
        workspace_id uuid NOT NULL REFERENCES "${schema}".workspaces(id),
        deleted_at timestamptz NULL
      );
      CREATE TABLE "${schema}".teamspace_members (
        id uuid PRIMARY KEY,
        teamspace_id uuid NOT NULL REFERENCES "${schema}".teamspaces(id) ON DELETE CASCADE,
        workspace_member_id uuid NOT NULL REFERENCES "${schema}".workspace_members(id) ON DELETE CASCADE,
        role_name text NOT NULL
      );
    `);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.query(`DROP SCHEMA "${schema}" CASCADE`);
      await dataSource.destroy();
    }
  });

  async function fixture(ownerCount: number, secondTeamspaceLastOwner = false) {
    const workspaceId = randomUUID();
    const teamspaceId = randomUUID();
    const members = Array.from({ length: ownerCount }, () => randomUUID());
    await dataSource.query(`INSERT INTO "${schema}".workspaces (id) VALUES ($1)`, [workspaceId]);
    for (const memberId of members) {
      await dataSource.query(
        `INSERT INTO "${schema}".workspace_members (id, workspace_id) VALUES ($1, $2)`,
        [memberId, workspaceId],
      );
    }
    await dataSource.query(
      `INSERT INTO "${schema}".teamspaces (id, workspace_id) VALUES ($1, $2)`,
      [teamspaceId, workspaceId],
    );
    for (const memberId of members) {
      await dataSource.query(
        `INSERT INTO "${schema}".teamspace_members
         (id, teamspace_id, workspace_member_id, role_name) VALUES ($1, $2, $3, 'OWNER')`,
        [randomUUID(), teamspaceId, memberId],
      );
    }
    let secondTeamspaceId: string | undefined;
    if (secondTeamspaceLastOwner) {
      secondTeamspaceId = randomUUID();
      await dataSource.query(
        `INSERT INTO "${schema}".teamspaces (id, workspace_id) VALUES ($1, $2)`,
        [secondTeamspaceId, workspaceId],
      );
      await dataSource.query(
        `INSERT INTO "${schema}".teamspace_members
         (id, teamspace_id, workspace_member_id, role_name) VALUES ($1, $2, $3, 'OWNER')`,
        [randomUUID(), secondTeamspaceId, members[0]],
      );
    }
    return { workspaceId, teamspaceId, secondTeamspaceId, members };
  }

  async function runner(): Promise<QueryRunner> {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    await queryRunner.query(`SET LOCAL search_path TO "${schema}"`);
    return queryRunner;
  }

  async function ownerCount(teamspaceId: string): Promise<number> {
    const [row] = await dataSource.query<Array<{ count: number }>>(
      `SELECT COUNT(*)::int AS count FROM "${schema}".teamspace_members
       WHERE teamspace_id = $1 AND role_name = 'OWNER'`,
      [teamspaceId],
    );
    return row.count;
  }

  it('rejects the last owner without deleting either membership', async () => {
    const { workspaceId, teamspaceId, members } = await fixture(1);
    const transaction = await runner();
    try {
      await expect(
        guard.assertCanRemoveWorkspaceMember(workspaceId, members[0], transaction.manager),
      ).rejects.toBeInstanceOf(ConflictException);
    } finally {
      await transaction.rollbackTransaction();
      await transaction.release();
    }
    expect(await ownerCount(teamspaceId)).toBe(1);
    const [row] = await dataSource.query<Array<{ count: number }>>(
      `SELECT COUNT(*)::int AS count FROM "${schema}".workspace_members WHERE id = $1`,
      [members[0]],
    );
    expect(row.count).toBe(1);
  });

  it('allows one of two owners to leave and cascades only that membership', async () => {
    const { workspaceId, teamspaceId, members } = await fixture(2);
    const transaction = await runner();
    try {
      await guard.assertCanRemoveWorkspaceMember(workspaceId, members[0], transaction.manager);
      await transaction.query('DELETE FROM workspace_members WHERE id = $1', [members[0]]);
      await transaction.commitTransaction();
    } finally {
      if (transaction.isTransactionActive) await transaction.rollbackTransaction();
      await transaction.release();
    }
    expect(await ownerCount(teamspaceId)).toBe(1);
  });

  it('serializes concurrent removal of two owners', async () => {
    const { workspaceId, teamspaceId, members } = await fixture(2);
    async function remove(memberId: string): Promise<'removed' | 'blocked'> {
      const transaction = await runner();
      try {
        await guard.assertCanRemoveWorkspaceMember(workspaceId, memberId, transaction.manager);
        await transaction.query('DELETE FROM workspace_members WHERE id = $1', [memberId]);
        await transaction.commitTransaction();
        return 'removed';
      } catch (error) {
        await transaction.rollbackTransaction();
        if (error instanceof ConflictException) return 'blocked';
        throw error;
      } finally {
        await transaction.release();
      }
    }
    const outcomes = await Promise.all(members.map(remove));
    expect(outcomes.sort()).toEqual(['blocked', 'removed']);
    expect(await ownerCount(teamspaceId)).toBe(1);
  });

  it('rolls back removal when one of several Teamspaces has a last owner', async () => {
    const { workspaceId, teamspaceId, secondTeamspaceId, members } = await fixture(2, true);
    const transaction = await runner();
    try {
      await expect(
        guard.assertCanRemoveWorkspaceMember(workspaceId, members[0], transaction.manager),
      ).rejects.toBeInstanceOf(ConflictException);
    } finally {
      await transaction.rollbackTransaction();
      await transaction.release();
    }
    expect(await ownerCount(teamspaceId)).toBe(2);
    expect(await ownerCount(secondTeamspaceId!)).toBe(1);
  });

  it('holds the Teamspace row lock until the transaction finishes', async () => {
    const { workspaceId, teamspaceId, members } = await fixture(2);
    const holder = await runner();
    const writer = await runner();
    try {
      await guard.assertCanRemoveWorkspaceMember(workspaceId, members[0], holder.manager);
      await writer.query("SET LOCAL lock_timeout = '200ms'");
      await expect(
        writer.query('UPDATE teamspaces SET deleted_at = deleted_at WHERE id = $1', [teamspaceId]),
      ).rejects.toMatchObject({ code: '55P03' });
    } finally {
      await writer.rollbackTransaction();
      await holder.rollbackTransaction();
      await writer.release();
      await holder.release();
    }
  });
});
