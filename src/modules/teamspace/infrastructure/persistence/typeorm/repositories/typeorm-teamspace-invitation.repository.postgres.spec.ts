import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { DATABASE_ENTITIES } from 'src/database/entities';
import { GetMyTeamspaceInvitationsHandler } from 'src/modules/teamspace/application/queries/teamspace/get-my-teamspace-invitations/get-my-teamspace-invitations.handler';
import { GetMyTeamspaceInvitationsQuery } from 'src/modules/teamspace/application/queries/teamspace/get-my-teamspace-invitations/get-my-teamspace-invitations.query';
import { TeamspaceInvitationOrmEntity } from '../entities/teamspace-invitation.orm-entity';
import { TypeOrmTeamspaceInvitationRepository } from './typeorm-teamspace-invitation.repository';

const url = process.env.NOTIFICATION_TEST_DATABASE_URL;
const describePostgres =
  process.env.RUN_NOTIFICATION_PG_E2E === '1' ? describe : describe.skip;

describePostgres(
  'TypeOrmTeamspaceInvitationRepository.findByRecipientUserId with real PostgreSQL',
  () => {
    let db: DataSource;
    let repository: TypeOrmTeamspaceInvitationRepository;

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
        // One connection so the temporary tables (which shadow real ones) stay visible.
        extra: { max: 1 },
      });
      await db.initialize();
      await db.query(`
      CREATE TEMP TABLE users (id uuid PRIMARY KEY, username text NOT NULL, deleted_at timestamptz);
      CREATE TEMP TABLE workspaces (id uuid PRIMARY KEY, name text NOT NULL, deleted_at timestamptz);
      CREATE TEMP TABLE workspace_members (id uuid PRIMARY KEY, workspace_id uuid NOT NULL, user_id uuid NOT NULL);
      CREATE TEMP TABLE teamspaces (
        id uuid PRIMARY KEY, workspace_id uuid NOT NULL, name text NOT NULL, icon text, deleted_at timestamptz
      );
      CREATE TEMP TABLE teamspace_invitations (
        id uuid PRIMARY KEY, teamspace_id uuid NOT NULL, workspace_member_id uuid NOT NULL,
        invited_by uuid, status varchar(16) NOT NULL, expires_at timestamptz NOT NULL,
        accepted_at timestamptz, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL
      );
    `);
      repository = new TypeOrmTeamspaceInvitationRepository(
        db.getRepository(TeamspaceInvitationOrmEntity),
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

    async function fixture() {
      const recipient = randomUUID();
      const inviter = randomUUID();
      const stranger = randomUUID();
      const workspace = randomUUID();
      const recipientMember = randomUUID();
      const strangerMember = randomUUID();

      await insert('users', { id: recipient, username: 'recipient' });
      await insert('users', { id: inviter, username: 'alice' });
      await insert('users', { id: stranger, username: 'stranger' });
      await insert('workspaces', { id: workspace, name: 'Acme' });
      await insert('workspace_members', {
        id: recipientMember,
        workspace_id: workspace,
        user_id: recipient,
      });
      await insert('workspace_members', {
        id: strangerMember,
        workspace_id: workspace,
        user_id: stranger,
      });

      const teamspace = async (name: string, deleted = false) => {
        const id = randomUUID();
        await insert('teamspaces', {
          id,
          workspace_id: workspace,
          name,
          icon: '🚀',
          deleted_at: deleted ? new Date() : null,
        });
        return id;
      };

      const invite = async (
        teamspaceId: string,
        workspaceMemberId: string,
        createdAt: string,
        options: { invitedBy?: string | null; expiresAt?: string } = {},
      ) => {
        const id = randomUUID();
        await insert('teamspace_invitations', {
          id,
          teamspace_id: teamspaceId,
          workspace_member_id: workspaceMemberId,
          invited_by:
            options.invitedBy === undefined ? inviter : options.invitedBy,
          status: 'PENDING',
          expires_at: options.expiresAt ?? '2999-01-01T00:00:00Z',
          accepted_at: null,
          created_at: createdAt,
          updated_at: createdAt,
        });
        return id;
      };

      return {
        recipient,
        inviter,
        workspace,
        recipientMember,
        strangerMember,
        teamspace,
        invite,
      };
    }

    it('returns the recipient invitations with display names, newest first', async () => {
      const f = await fixture();
      const backend = await f.teamspace('Backend');
      const design = await f.teamspace('Design');
      const older = await f.invite(
        backend,
        f.recipientMember,
        '2026-10-20T00:00:00Z',
      );
      const newer = await f.invite(
        design,
        f.recipientMember,
        '2026-10-22T00:00:00Z',
      );
      await f.invite(backend, f.strangerMember, '2026-10-23T00:00:00Z');

      const views = await repository.findByRecipientUserId(f.recipient);

      expect(views.map((view) => view.invitation.getId())).toEqual([
        newer,
        older,
      ]);
      expect(views[1]).toMatchObject({
        teamspaceName: 'Backend',
        teamspaceIcon: '🚀',
        workspaceId: f.workspace,
        workspaceName: 'Acme',
        inviterName: 'alice',
      });
    });

    it('keeps the invitation but drops the name when the inviter is gone', async () => {
      const f = await fixture();
      const teamspace = await f.teamspace('Ops');
      await f.invite(teamspace, f.recipientMember, '2026-10-20T00:00:00Z');
      await db.query(
        'UPDATE pg_temp.users SET deleted_at = now() WHERE id = $1',
        [f.inviter],
      );
      const withoutInviter = await f.invite(
        teamspace,
        f.recipientMember,
        '2026-10-21T00:00:00Z',
        {
          invitedBy: null,
        },
      );

      const views = await repository.findByRecipientUserId(f.recipient);

      expect(views).toHaveLength(2);
      expect(views.every((view) => view.inviterName === null)).toBe(true);
      expect(views[0].invitation.getId()).toBe(withoutInviter);
    });

    it('hides invitations to deleted teamspaces', async () => {
      const f = await fixture();
      const deleted = await f.teamspace('Archived', true);
      await f.invite(deleted, f.recipientMember, '2026-10-20T00:00:00Z');

      await expect(
        repository.findByRecipientUserId(f.recipient),
      ).resolves.toEqual([]);
    });

    it('serves the API response with the effective status and display fields', async () => {
      const f = await fixture();
      const teamspace = await f.teamspace('QA');
      const expired = await f.invite(
        teamspace,
        f.recipientMember,
        '2026-10-20T00:00:00Z',
        {
          expiresAt: '2020-01-01T00:00:00Z',
        },
      );

      const handler = new GetMyTeamspaceInvitationsHandler(repository);
      const [dto] = await handler.execute(
        new GetMyTeamspaceInvitationsQuery(f.recipient),
      );

      expect(dto).toMatchObject({
        id: expired,
        teamspaceId: teamspace,
        status: 'EXPIRED',
        teamspaceName: 'QA',
        workspaceName: 'Acme',
        inviterName: 'alice',
      });
    });
  },
);
