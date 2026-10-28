/**
 * M2 check (kế hoạch tìm theo hoạt động): runs the "Pages I edited …" query
 * on the configured database with fixed edit times and a fixed "now". Seeds
 * inside ONE transaction and rolls it back, so nothing is left behind.
 *
 *   npx ts-node -r tsconfig-paths/register scripts/check-recent-edits.ts
 */
import 'reflect-metadata';

import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import source from '../src/database/data-source';
import type { RecentEditsQuery } from '../src/modules/ai_assistant/application/resolution/page-resolution.port';
import { PageExactResolutionReader } from '../src/modules/ai_assistant/infrastructure/resolution/page-exact-resolution.reader';
import type { PageRepository } from '../src/modules/content/domain/repositories/page.repository';

function check(name: string, actual: string[], expected: string[]): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`}`,
  );
  if (!ok) process.exitCode = 1;
}

async function main(): Promise<void> {
  await source.initialize();
  const runner = source.createQueryRunner();
  await runner.connect();
  await runner.startTransaction();
  try {
    const manager = runner.manager;
    const tag = randomUUID().slice(0, 8);
    const insert = async (sql: string, params: unknown[]): Promise<string> =>
      (await manager.query<{ id: string }[]>(sql, params))[0].id;
    const user = (name: string) =>
      insert(
        `INSERT INTO users (email, username) VALUES ($1, $2) RETURNING id`,
        [`bench-${name}-${tag}@example.test`, `bench_${name}_${tag}`],
      );
    const me = await user('me');
    const other = await user('other');
    const workspaceId = await insert(
      `INSERT INTO workspaces (name, slug, created_by) VALUES ($1, $2, $3) RETURNING id`,
      ['Bench', `bench-${tag}`, me],
    );
    const root = await insert(
      `INSERT INTO pages (workspace_id, title, created_by, public_subdomain)
       VALUES ($1, 'Bench root', $2, $3) RETURNING id`,
      [workspaceId, me, `bench-${tag}`],
    );
    const page = (title: string) =>
      insert(
        `INSERT INTO pages (workspace_id, title, created_by, parent_page_id)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [workspaceId, title, me, root],
      );
    // Edits at instants given in UTC, stored the way the app stores them.
    const edit = (
      actor: string,
      pageId: string,
      at: string,
      action = 'PAGE_BLOCK_UPDATED',
    ) =>
      manager.query(
        `INSERT INTO activities (workspace_id, entity_type, entity_id, actor_id, action, metadata, created_at)
         VALUES ($1, 'PAGE_BLOCK', gen_random_uuid(), $2, $3, jsonb_build_object('pageId', $4::text),
                 $5::timestamptz AT TIME ZONE current_setting('TimeZone'))`,
        [workspaceId, actor, action, pageId, at],
      );

    const yesterday = await page('Hôm qua'); // 27/10 10:00 VN
    const today = await page('Hôm nay'); // 28/10 05:30 VN
    const beforeYesterday = await page('Hôm kia'); // 26/10 23:30 VN
    const lastWeek = await page('Tuần trước'); // 21/10 (Thứ Ba tuần trước) 09:00 VN
    const othersPage = await page('Người khác sửa'); // other user, 27/10
    const deleted = await page('Đã xoá'); // 27/10, then deleted
    const old = await page('Rất cũ'); // 100 days ago
    await edit(me, yesterday, '2026-10-27T03:00:00Z');
    await edit(me, today, '2026-10-27T22:30:00Z');
    await edit(me, beforeYesterday, '2026-10-26T16:30:00Z');
    await edit(me, lastWeek, '2026-10-21T02:00:00Z');
    await edit(other, othersPage, '2026-10-27T03:00:00Z');
    await edit(me, deleted, '2026-10-27T04:00:00Z');
    await manager.query(`UPDATE pages SET deleted_at = now() WHERE id = $1`, [
      deleted,
    ]);
    await edit(me, old, '2026-07-20T03:00:00Z');
    // A delete alone is not "editing" a Page.
    await edit(me, beforeYesterday, '2026-10-27T05:00:00Z', 'PAGE_DELETED');

    const reader = new PageExactResolutionReader(
      {} as PageRepository,
      manager.connection,
    );
    // The reader must run inside this transaction to see the seeded rows.
    (reader as unknown as { dataSource: unknown }).dataSource = manager;
    // 06:00 on 28/10 in Việt Nam is still 27/10 in UTC.
    const now = new Date('2026-10-27T23:00:00Z');
    const titles = async (query: Omit<RecentEditsQuery, 'now'>) =>
      (
        await reader.findRecentlyEditedPages(me, workspaceId, { ...query, now })
      ).map((row) => row.title);
    const vn = 'Asia/Ho_Chi_Minh';

    check(
      'hôm qua lúc 06:00 giờ VN',
      await titles({ relative: 'YESTERDAY', days: null, timeZone: vn }),
      ['Hôm qua'],
    );
    check(
      'hôm nay',
      await titles({ relative: 'TODAY', days: null, timeZone: vn }),
      ['Hôm nay'],
    );
    check(
      'hôm kia (2 ngày trước)',
      await titles({ relative: 'N_DAYS_AGO', days: 2, timeZone: vn }),
      ['Hôm kia'],
    );
    check(
      'tuần trước (Thứ Hai → Chủ nhật)',
      await titles({ relative: 'LAST_WEEK', days: null, timeZone: vn }),
      ['Tuần trước'],
    );
    check(
      'gần đây (7 ngày), mới nhất trước',
      await titles({ relative: 'RECENT', days: null, timeZone: vn }),
      ['Hôm nay', 'Hôm qua', 'Hôm kia', 'Tuần trước'],
    );
    check(
      'gần nhất (90 ngày)',
      (await titles({ relative: 'LATEST', days: null, timeZone: vn })).slice(
        0,
        1,
      ),
      ['Hôm nay'],
    );
    // In UTC, "yesterday" at this instant is 26/10.
    check(
      'hôm qua theo UTC',
      await titles({ relative: 'YESTERDAY', days: null, timeZone: 'UTC' }),
      ['Hôm kia'],
    );

    const started = performance.now();
    for (let index = 0; index < 50; index++) {
      await reader.findRecentlyEditedPages(me, workspaceId, {
        relative: 'RECENT',
        days: null,
        timeZone: vn,
        now,
      });
    }
    console.log(
      `query: ${((performance.now() - started) / 50).toFixed(2)} ms on average`,
    );
  } finally {
    await runner.rollbackTransaction();
    await runner.release();
    await source.destroy();
  }
}

void main();
