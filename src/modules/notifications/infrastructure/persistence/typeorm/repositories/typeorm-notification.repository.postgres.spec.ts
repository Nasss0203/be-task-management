import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { DATABASE_ENTITIES } from 'src/database/entities';
import { NotificationType } from '../../../../domain/entities/notification.entity';
import { Notification } from '../entities/notification.orm-entity';
import { TypeOrmNotificationRepository } from './typeorm-notification.repository';

const url = process.env.NOTIFICATION_TEST_DATABASE_URL;
const describePostgres =
  process.env.RUN_NOTIFICATION_PG_E2E === '1' ? describe : describe.skip;

describePostgres('TypeOrmNotificationRepository with real PostgreSQL', () => {
  let db: DataSource;
  let repository: TypeOrmNotificationRepository;

  const alice = randomUUID();
  const bob = randomUUID();

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
      // One connection: the temporary table below exists only in that session
      // and shadows any real "notifications" table, so nothing is persisted.
      extra: { max: 1 },
    });
    await db.initialize();
    await db.query(`
      CREATE TEMP TABLE notifications (
        id uuid PRIMARY KEY, receiver_id uuid NOT NULL,
        sender_type text NOT NULL DEFAULT 'SYSTEM', actor_id uuid,
        source_type varchar(64) NOT NULL DEFAULT 'system', source_id uuid, workspace_id uuid,
        type varchar(100) NOT NULL, title varchar(255) NOT NULL, message text, action_url text,
        metadata jsonb, read_at timestamp, archived_at timestamp,
        created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now()
      )`);
    repository = new TypeOrmNotificationRepository(
      db.getRepository(Notification),
    );
  });

  afterAll(async () => {
    if (db?.isInitialized) await db.destroy();
  });

  beforeEach(async () => {
    await db.query('TRUNCATE pg_temp.notifications');
  });

  async function seed(
    receiverId: string,
    createdAt: string,
    options: { read?: boolean; archived?: boolean } = {},
  ): Promise<string> {
    const id = randomUUID();
    await db.query(
      `INSERT INTO pg_temp.notifications
        (id, receiver_id, type, title, created_at, read_at, archived_at)
       VALUES ($1, $2, $3, 'Title', $4, $5, $6)`,
      [
        id,
        receiverId,
        NotificationType.SYSTEM_ANNOUNCEMENT,
        createdAt,
        options.read ? createdAt : null,
        options.archived ? createdAt : null,
      ],
    );
    return id;
  }

  async function pageAll(receiverId: string, limit: number): Promise<string[]> {
    const ids: string[] = [];
    let cursorId: string | undefined;
    for (let guard = 0; guard < 50; guard++) {
      const page = await repository.findMyNotifications({
        receiverId,
        limit,
        cursorId,
      });
      ids.push(...page.map((notification) => notification.id));
      if (page.length < limit) return ids;
      cursorId = page[page.length - 1].id;
    }
    throw new Error('Pagination did not terminate');
  }

  it('pages through every row exactly once, including timestamp ties within one millisecond', async () => {
    const expected = [
      await seed(alice, '2026-10-24 10:00:05.000000'),
      // Three rows with the exact same timestamp (same transaction / same now()).
      await seed(alice, '2026-10-24 10:00:04.123456'),
      await seed(alice, '2026-10-24 10:00:04.123456'),
      await seed(alice, '2026-10-24 10:00:04.123456'),
      // Same millisecond, different microseconds: a ms-truncated Date cursor would skip these.
      await seed(alice, '2026-10-24 10:00:04.123300'),
      await seed(alice, '2026-10-24 10:00:04.123100'),
      await seed(alice, '2026-10-24 10:00:03.000000'),
    ];
    await seed(alice, '2026-10-24 10:00:06.000000', { archived: true });
    await seed(bob, '2026-10-24 10:00:04.500000');

    const ids = await pageAll(alice, 2);

    expect(ids).toHaveLength(expected.length);
    expect(new Set(ids)).toEqual(new Set(expected));
    // Newest first: rows sharing a timestamp are tie-broken by id.
    const rows = await repository.findMyNotifications({
      receiverId: alice,
      limit: 100,
    });
    const createdAt = rows.map((row) => row.createdAt.getTime());
    expect([...createdAt].sort((a, b) => b - a)).toEqual(createdAt);
  });

  it('returns an empty page for a cursor that belongs to another user', async () => {
    await seed(alice, '2026-10-24 10:00:01');
    const bobsNotification = await seed(bob, '2026-10-24 10:00:02');

    const page = await repository.findMyNotifications({
      receiverId: alice,
      cursorId: bobsNotification,
      limit: 10,
    });

    expect(page).toEqual([]);
  });

  it('applies unreadOnly together with the cursor', async () => {
    const newest = await seed(alice, '2026-10-24 10:00:03');
    await seed(alice, '2026-10-24 10:00:02', { read: true });
    const unreadOlder = await seed(alice, '2026-10-24 10:00:01');

    const page = await repository.findMyNotifications({
      receiverId: alice,
      unreadOnly: true,
      cursorId: newest,
      limit: 10,
    });

    expect(page.map((row) => row.id)).toEqual([unreadOlder]);
  });

  it('counts only the receiver unread, non-archived notifications', async () => {
    await seed(alice, '2026-10-24 10:00:01');
    await seed(alice, '2026-10-24 10:00:02');
    await seed(alice, '2026-10-24 10:00:03', { read: true });
    await seed(alice, '2026-10-24 10:00:04', { archived: true });
    await seed(bob, '2026-10-24 10:00:05');

    await expect(repository.countUnread(alice)).resolves.toBe(2);
    await expect(repository.countUnread(bob)).resolves.toBe(1);
  });

  it('marks one notification as read only for its owner, idempotently', async () => {
    const own = await seed(alice, '2026-10-24 10:00:01');
    const bobs = await seed(bob, '2026-10-24 10:00:02');

    await expect(repository.markAsRead(bobs, alice)).resolves.toBe(0);
    await expect(repository.countUnread(bob)).resolves.toBe(1);

    await expect(repository.markAsRead(own, alice)).resolves.toBe(1);
    await expect(repository.markAsRead(own, alice)).resolves.toBe(0);
    await expect(repository.countUnread(alice)).resolves.toBe(0);
  });

  it('marks all as read for the receiver only', async () => {
    await seed(alice, '2026-10-24 10:00:01');
    await seed(alice, '2026-10-24 10:00:02');
    await seed(alice, '2026-10-24 10:00:03', { read: true });
    await seed(bob, '2026-10-24 10:00:04');

    await expect(repository.markAllAsRead(alice)).resolves.toBe(2);
    await expect(repository.countUnread(alice)).resolves.toBe(0);
    await expect(repository.countUnread(bob)).resolves.toBe(1);
  });

  it('inserts a delivery notification once and ignores the retry', async () => {
    const deliveryId = randomUUID();
    const input = {
      id: deliveryId,
      receiverId: alice,
      type: NotificationType.TEAMSPACE_INVITATION_RECEIVED,
      title: 'Lời mời tham gia Teamspace',
    };

    const first = await repository.insertNotificationIfAbsent(input);
    const retry = await repository.insertNotificationIfAbsent({
      ...input,
      title: 'Changed on retry',
    });

    expect(first?.id).toBe(deliveryId);
    expect(retry).toBeNull();
    const rows = await db.query<Array<{ title: string }>>(
      `SELECT title FROM pg_temp.notifications WHERE id = $1`,
      [deliveryId],
    );
    expect(rows).toEqual([{ title: 'Lời mời tham gia Teamspace' }]);
  });
});
