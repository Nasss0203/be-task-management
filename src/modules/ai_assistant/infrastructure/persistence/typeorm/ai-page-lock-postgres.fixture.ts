import { randomUUID } from 'node:crypto';
import { DataSource, type QueryRunner } from 'typeorm';
import { DATABASE_ENTITIES } from 'src/database/entities';

/** Never fall back to .env or the application DataSource. Killing Jest can
 * leave only an owned schema in an explicitly disposable test database. */
export const describePostgres =
  process.env.RUN_AI_PAGE_LOCK_PG_E2E === '1' ? describe : describe.skip;

export class AiPageLockPostgresFixture {
  readonly schema = `ai_lock_${randomUUID().replaceAll('-', '')}`;
  readonly pageId = randomUUID();
  readonly ancestorId = randomUUID();
  readonly rootId = randomUUID();
  readonly unrelatedId = randomUUID();
  readonly userId = randomUUID();
  readonly creatorId = randomUUID();
  readonly workspaceId = randomUUID();
  readonly teamspaceId = randomUUID();
  readonly blockId = randomUUID();
  source!: DataSource;
  holder!: QueryRunner;
  writer!: QueryRunner;

  async initialize(): Promise<void> {
    const value = process.env.AI_PAGE_LOCK_TEST_DATABASE_URL;
    if (!value)
      throw new Error(
        'AI_PAGE_LOCK_TEST_DATABASE_URL is required; application DB is forbidden',
      );
    const url = new URL(value);
    if (
      !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
      decodeURIComponent(url.pathname) !== '/taskmanly_ai_lock_test'
    ) {
      throw new Error(
        'PostgreSQL lock tests require a local taskmanly_ai_lock_test database',
      );
    }
    this.source = new DataSource({
      type: 'postgres',
      url: value,
      schema: this.schema,
      entities: DATABASE_ENTITIES,
      synchronize: false,
      migrationsRun: false,
      logging: false,
      installExtensions: false,
      extra: { options: `-c search_path=${this.schema}`, max: 8 },
    });
    await this.source.initialize();
    await this.source.query(`CREATE SCHEMA "${this.schema}"`);
    // Minimal columns used by production locks/readers/repositories. FK shape
    // matches checked-in baseline: shares lack a Page FK; settings have one.
    await this.source.query(`
      CREATE TABLE pages (id uuid PRIMARY KEY, parent_page_id uuid REFERENCES pages(id),
        workspace_id uuid NOT NULL, teamspace_id uuid, deleted_at timestamp, title text NOT NULL,
        created_by uuid NOT NULL);
      CREATE TABLE page_blocks (id uuid PRIMARY KEY, page_id uuid REFERENCES pages(id),
        type text, order_index int, created_by uuid, deleted_at timestamp, data_config jsonb, title text);
      CREATE TABLE databases (id uuid PRIMARY KEY, page_id uuid REFERENCES pages(id));
      CREATE TABLE database_properties (id uuid PRIMARY KEY, database_id uuid REFERENCES databases(id));
      CREATE TABLE database_property_options (id uuid PRIMARY KEY, property_id uuid REFERENCES database_properties(id));
      CREATE TABLE database_views (id uuid PRIMARY KEY, database_id uuid REFERENCES databases(id));
      CREATE TABLE database_view_properties (id uuid PRIMARY KEY, view_id uuid REFERENCES database_views(id));
      CREATE TABLE database_rows (id uuid PRIMARY KEY, database_id uuid REFERENCES databases(id));
      CREATE TABLE database_row_values (id uuid PRIMARY KEY, row_id uuid REFERENCES database_rows(id));
      CREATE TABLE page_shares (id uuid PRIMARY KEY, page_id uuid NOT NULL, user_id uuid NOT NULL,
        access_level text NOT NULL, status text NOT NULL, created_by uuid NOT NULL, share_link_id uuid,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(page_id, user_id));
      CREATE TABLE page_share_settings (id uuid PRIMARY KEY, page_id uuid UNIQUE REFERENCES pages(id),
        workspace_access_level text, link_access_level text,
        created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now());
      CREATE TABLE page_share_links (id uuid PRIMARY KEY, page_id uuid REFERENCES pages(id), revoked_at timestamp);
      CREATE TABLE workspace_members (id uuid PRIMARY KEY, workspace_id uuid, user_id uuid,
        membership_type text, role_name text);
      CREATE TABLE teamspaces (id uuid PRIMARY KEY);
      CREATE TABLE teamspace_members (id uuid PRIMARY KEY, teamspace_id uuid, workspace_member_id uuid);
    `);
    this.holder = this.source.createQueryRunner();
    this.writer = this.source.createQueryRunner();
    await Promise.all([this.holder.connect(), this.writer.connect()]);
    await this.reset();
  }

  async reset(): Promise<void> {
    for (const runner of [this.writer, this.holder]) {
      if (runner?.isTransactionActive) await runner.rollbackTransaction();
    }
    await this.source
      .query(`TRUNCATE page_shares, page_share_settings, page_share_links,
      workspace_members, teamspace_members, teamspaces, pages CASCADE`);
    for (const [id, parent] of [
      [this.rootId, null],
      [this.ancestorId, this.rootId],
      [this.pageId, this.ancestorId],
      [this.unrelatedId, null],
    ]) {
      await this.source.query(
        `INSERT INTO pages (id, parent_page_id, workspace_id,
        teamspace_id, title, created_by) VALUES ($1,$2,$3,$4,'Isolated lock fixture',$5)`,
        [id, parent, this.workspaceId, this.teamspaceId, this.creatorId],
      );
    }
    await this.source.query(
      `INSERT INTO page_blocks (id,page_id,type,order_index,created_by)
      VALUES ($1,$2,'TEXT',0,$3)`,
      [this.blockId, this.pageId, this.creatorId],
    );
    await this.source.query('INSERT INTO teamspaces(id) VALUES ($1)', [
      this.teamspaceId,
    ]);
  }

  async destroy(): Promise<void> {
    for (const runner of [this.writer, this.holder]) {
      if (runner?.isTransactionActive) await runner.rollbackTransaction();
      if (runner && !runner.isReleased) await runner.release();
    }
    if (this.source?.isInitialized) {
      if (!/^ai_lock_[a-f0-9]{32}$/.test(this.schema))
        throw new Error('Unsafe fixture schema');
      await this.source.query(`DROP SCHEMA "${this.schema}" CASCADE`);
      await this.source.destroy();
    }
  }

  async expectBlocked(
    write: (runner: QueryRunner) => Promise<unknown>,
  ): Promise<void> {
    await this.writer.startTransaction();
    try {
      await this.writer.query("SET LOCAL lock_timeout = '200ms'");
      await expect(write(this.writer)).rejects.toMatchObject({ code: '55P03' });
    } finally {
      await this.writer.rollbackTransaction();
    }
  }

  async waitForBlockedWriter(): Promise<void> {
    const [{ pid }] = await this.writer.manager.query<{ pid: number }[]>(
      'SELECT pg_backend_pid() AS pid',
    );
    const deadline = Date.now() + 1500;
    while (Date.now() < deadline) {
      const rows = await this.source.query<{ pid: number }[]>(
        'SELECT pid FROM pg_stat_activity WHERE $1 = ANY(pg_blocking_pids(pid))',
        [pid],
      );
      if (rows.length) return;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw new Error('Confirm did not wait for the permission writer');
  }
}
