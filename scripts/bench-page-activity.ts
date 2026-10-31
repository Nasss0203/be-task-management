/**
 * Activity log check (kế hoạch ghi activity): runs the merged Page-edit write
 * on the configured database and times it. Seeds inside ONE transaction and
 * rolls it back, so nothing is left behind.
 *
 *   npx ts-node -r tsconfig-paths/register scripts/bench-page-activity.ts
 */
import 'reflect-metadata';

import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import source from '../src/database/data-source';
import { ActivityAction } from '../src/modules/activity/domain/entities/activity.entity';
import { Activity } from '../src/modules/activity/infrastructure/persistence/typeorm/entities/activity.orm-entity';
import { TypeOrmActivityRepository } from '../src/modules/activity/infrastructure/persistence/typeorm/repositories/typeorm-activity.repository';
import { ActivityPageActivityRecorder } from '../src/modules/content/infrastructure/activity/page-activity.recorder';

const OTHER_ROWS = 20000;
const RUNS = 200;

function check(name: string, ok: boolean): void {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
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
    const userId = await user('a');
    const otherUser = await user('b');
    const workspaceId = await insert(
      `INSERT INTO workspaces (name, slug, created_by) VALUES ($1, $2, $3) RETURNING id`,
      ['Bench', `bench-${tag}`, userId],
    );
    const page = (title: string, subdomain: string) =>
      insert(
        `INSERT INTO pages (workspace_id, title, created_by, public_subdomain)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [workspaceId, title, userId, `${subdomain}-${tag}`],
      );
    const pageId = await page('Activity bench', 'bench-a');
    const otherPage = await page('Activity bench 2', 'bench-b');

    const recorder = new ActivityPageActivityRecorder(
      new TypeOrmActivityRepository(manager.getRepository(Activity)),
    );
    const rows = async (): Promise<number> =>
      Number(
        (
          await manager.query<{ count: string }[]>(
            `SELECT count(*) FROM activities WHERE workspace_id = $1`,
            [workspaceId],
          )
        )[0].count,
      );
    const edit = (
      actorId: string,
      page: string,
      blockId: string,
      action:
        | 'PAGE_BLOCK_UPDATED'
        | 'PAGE_BLOCK_DELETED' = 'PAGE_BLOCK_UPDATED',
    ) => recorder.record({ actorId, pageId: page, blockId, action }, manager);
    const block = randomUUID();

    // Merging (plan-v2 §11 #5).
    await edit(userId, pageId, block);
    check('first edit inserts a row', (await rows()) === 1);
    await edit(userId, pageId, randomUUID());
    check(
      'another block of the same Page within 5 minutes merges',
      (await rows()) === 1,
    );
    await edit(userId, pageId, block, 'PAGE_BLOCK_DELETED');
    check('another action adds a row', (await rows()) === 2);
    await edit(otherUser, pageId, block);
    check('another person adds a row', (await rows()) === 3);
    await edit(userId, otherPage, block);
    check('another Page adds a row', (await rows()) === 4);
    await manager.query(
      `UPDATE activities SET created_at = localtimestamp - interval '6 minutes' WHERE workspace_id = $1`,
      [workspaceId],
    );
    await edit(userId, pageId, block);
    check('after 5 minutes a new row is added', (await rows()) === 5);
    const [stored] = await manager.query<
      { metadata: unknown; action: ActivityAction }[]
    >(
      `SELECT metadata, action FROM activities WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [workspaceId],
    );
    check(
      'metadata holds only the Page id',
      JSON.stringify(stored.metadata) === JSON.stringify({ pageId }) &&
        stored.action === ActivityAction.PAGE_BLOCK_UPDATED,
    );
    await recorder.record(
      { actorId: null, pageId, action: 'PAGE_UPDATED' },
      manager,
    );
    check('system work is not recorded', (await rows()) === 5);

    // Timing with many rows of other people in the table.
    await manager.query(
      `INSERT INTO activities (workspace_id, entity_type, entity_id, actor_id, action, metadata)
       SELECT $1, 'PAGE_BLOCK', gen_random_uuid(), $2, 'PAGE_BLOCK_UPDATED', jsonb_build_object('pageId', gen_random_uuid())
       FROM generate_series(1, $3)`,
      [workspaceId, otherUser, OTHER_ROWS],
    );
    const samples: number[] = [];
    for (let index = 0; index < RUNS; index++) {
      const started = performance.now();
      await edit(userId, pageId, block);
      samples.push(performance.now() - started);
    }
    samples.sort((a, b) => a - b);
    const at = (q: number) =>
      samples[Math.floor(q * (samples.length - 1))].toFixed(2);
    console.log(
      `record (merge) with ${OTHER_ROWS} other rows: p50 ${at(0.5)} ms  p95 ${at(0.95)} ms`,
    );
  } finally {
    await runner.rollbackTransaction();
    await runner.release();
    await source.destroy();
  }
}

void main();
