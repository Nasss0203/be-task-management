import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { DATABASE_ENTITIES } from 'src/database/entities';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import { TeamspaceVisibility } from 'src/modules/teamspace/domain/enums/teamspace-visibility.enum';
import { WorkspaceMembershipType } from 'src/modules/workspace/domain/enums/workspace-membership-type.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import { TeamspaceOrmEntity } from '../entities/teamspace.orm-entity';
import { TypeOrmTeamspaceRepository } from './typeorm-teamspace.repository';

const url = process.env.NOTIFICATION_TEST_DATABASE_URL;
const describePostgres =
  process.env.RUN_NOTIFICATION_PG_E2E === '1' ? describe : describe.skip;

describePostgres(
  'TypeOrmTeamspaceRepository.findArchivedManageableByUser with real PostgreSQL',
  () => {
    let db: DataSource;
    let repository: TypeOrmTeamspaceRepository;

    beforeAll(async () => {
      if (!url) throw new Error('NOTIFICATION_TEST_DATABASE_URL is required');
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
        extra: { max: 1 },
      });
      await db.initialize();
      await db.query(`
      CREATE TEMP TABLE workspaces (id uuid PRIMARY KEY, name text NOT NULL, deleted_at timestamptz);
      CREATE TEMP TABLE workspace_members (
        id uuid PRIMARY KEY, workspace_id uuid NOT NULL, user_id uuid NOT NULL,
        role_name text NOT NULL, membership_type text NOT NULL
      );
      CREATE TEMP TABLE teamspaces (
        id uuid PRIMARY KEY, workspace_id uuid NOT NULL, name text NOT NULL, slug text NOT NULL,
        description text, icon text, visibility text NOT NULL, created_by uuid,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz, deleted_by uuid
      );
      CREATE TEMP TABLE teamspace_members (
        id uuid PRIMARY KEY, teamspace_id uuid NOT NULL, workspace_member_id uuid NOT NULL, role_name text NOT NULL
      );
    `);
      repository = new TypeOrmTeamspaceRepository(
        db.getRepository(TeamspaceOrmEntity),
      );
    });

    afterAll(async () => {
      if (db?.isInitialized) await db.destroy();
    });

    async function insert(table: string, row: Record<string, unknown>) {
      const columns = Object.keys(row);
      await db.query(
        `INSERT INTO pg_temp.${table} (${columns.join(', ')}) VALUES (${columns
          .map((_, index) => `$${index + 1}`)
          .join(', ')})`,
        Object.values(row),
      );
    }

    async function addWorkspaceMember(
      workspaceId: string,
      userId: string,
      roleName: WorkspaceRole,
      membershipType = WorkspaceMembershipType.MEMBER,
    ) {
      await insert('workspace_members', {
        id: randomUUID(),
        workspace_id: workspaceId,
        user_id: userId,
        role_name: roleName,
        membership_type: membershipType,
      });
    }

    async function fixture(visibility: TeamspaceVisibility) {
      const workspace = randomUUID();
      const owner = randomUUID();
      const member = randomUUID();
      const deleter = randomUUID();
      const teamspace = randomUUID();

      await insert('workspaces', { id: workspace, name: 'Acme' });
      await addWorkspaceMember(workspace, owner, WorkspaceRole.OWNER);
      await addWorkspaceMember(workspace, member, WorkspaceRole.MEMBER);
      await insert('teamspaces', {
        id: teamspace,
        workspace_id: workspace,
        name: 'Secret',
        slug: `secret-${teamspace}`,
        visibility,
        deleted_at: new Date(),
        deleted_by: deleter,
      });

      return { workspace, owner, member, deleter, teamspace };
    }

    const archivedIds = async (userId: string, teamspaceId: string) =>
      (
        await repository.findArchivedManageableByUser(userId, { teamspaceId })
      ).map((teamspace) => teamspace.getId());

    it('lets the workspace owner manage a private teamspace whose deleter left the workspace', async () => {
      const { owner, teamspace } = await fixture(TeamspaceVisibility.PRIVATE);

      await expect(archivedIds(owner, teamspace)).resolves.toEqual([teamspace]);
    });

    it('keeps a private teamspace with the deleter while they are still a workspace member', async () => {
      const { workspace, owner, deleter, teamspace } = await fixture(
        TeamspaceVisibility.PRIVATE,
      );
      await addWorkspaceMember(workspace, deleter, WorkspaceRole.MEMBER);

      await expect(archivedIds(owner, teamspace)).resolves.toEqual([]);
      await expect(archivedIds(deleter, teamspace)).resolves.toEqual([
        teamspace,
      ]);
    });

    it('treats a deleter who came back only as a guest as gone', async () => {
      const { workspace, owner, deleter, teamspace } = await fixture(
        TeamspaceVisibility.PRIVATE,
      );
      await addWorkspaceMember(
        workspace,
        deleter,
        WorkspaceRole.MEMBER,
        WorkspaceMembershipType.GUEST,
      );

      await expect(archivedIds(owner, teamspace)).resolves.toEqual([teamspace]);
    });

    it('gives nothing extra to a regular workspace member', async () => {
      const { member, teamspace } = await fixture(TeamspaceVisibility.PRIVATE);

      await expect(archivedIds(member, teamspace)).resolves.toEqual([]);
    });

    it('still lets a teamspace owner and the workspace owner manage an open teamspace', async () => {
      const { workspace, owner, member, deleter, teamspace } = await fixture(
        TeamspaceVisibility.OPEN,
      );
      await addWorkspaceMember(workspace, deleter, WorkspaceRole.MEMBER);
      const memberRow = await db.query<Array<{ id: string }>>(
        `SELECT id FROM pg_temp.workspace_members WHERE workspace_id = $1 AND user_id = $2`,
        [workspace, member],
      );
      await insert('teamspace_members', {
        id: randomUUID(),
        teamspace_id: teamspace,
        workspace_member_id: memberRow[0].id,
        role_name: TeamspaceRole.OWNER,
      });

      await expect(archivedIds(owner, teamspace)).resolves.toEqual([teamspace]);
      await expect(archivedIds(member, teamspace)).resolves.toEqual([
        teamspace,
      ]);
    });
  },
);
