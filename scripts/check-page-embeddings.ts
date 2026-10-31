/**
 * M5 check (kế hoạch hạ tầng vector): indexes three seeded Pages through the
 * running AI service, searches them, edits and trashes one, on the
 * configured database. Seeds and indexes (creating the M5 tables if the
 * migration has not run) inside ONE transaction and rolls it back, so the
 * database is left as it was.
 *
 *   npx ts-node -r tsconfig-paths/register scripts/check-page-embeddings.ts
 */
import 'reflect-metadata';

import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import source from '../src/database/data-source';
import { CreatePageEmbeddings1792430000000 } from '../src/database/migrations/1792430000000-CreatePageEmbeddings';
import { PageEmbeddingIndexer } from '../src/modules/ai_assistant/application/embedding/page-embedding-indexer.service';
import { PageEmbeddingSearch } from '../src/modules/ai_assistant/application/embedding/page-embedding-search.service';
import type { AiConversationAccessService } from '../src/modules/ai_assistant/application/services/ai-conversation-access.service';
import { PageEmbeddingSqlStore } from '../src/modules/ai_assistant/infrastructure/embedding/page-embedding.store';
import { FastApiAiRuntimeAdapter } from '../src/modules/ai_assistant/infrastructure/runtime/fast-api-ai-runtime.adapter';

function check(name: string, actual: unknown, expected: unknown): void {
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
    // Before `npm run migration:run` the M5 tables exist only in this transaction.
    const [{ exists }] = (await manager.query(
      `SELECT to_regclass('page_embeddings') IS NOT NULL AS exists`,
    )) as { exists: boolean }[];
    if (!exists) await new CreatePageEmbeddings1792430000000().up(runner);
    const tag = randomUUID().slice(0, 8);
    const insert = async (sql: string, params: unknown[]): Promise<string> =>
      (await manager.query<{ id: string }[]>(sql, params))[0].id;
    const userId = await insert(
      `INSERT INTO users (email, username) VALUES ($1, $2) RETURNING id`,
      [`bench-${tag}@example.test`, `bench_${tag}`],
    );
    const workspaceId = await insert(
      `INSERT INTO workspaces (name, slug, created_by) VALUES ($1, $2, $3) RETURNING id`,
      ['Bench', `bench-${tag}`, userId],
    );
    const page = (title: string) =>
      insert(
        `INSERT INTO pages (workspace_id, title, created_by, public_subdomain)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [
          workspaceId,
          title,
          userId,
          `${title.replace(/\W+/g, '-').toLowerCase()}-${tag}`,
        ],
      );
    const block = (pageId: string, type: string, text: string, order: number) =>
      insert(
        `INSERT INTO page_blocks (page_id, type, content, order_index, created_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [pageId, type, { text }, order, userId],
      );
    const auth = await page('Authentication Improvements');
    await block(auth, 'HEADER', 'Login', 0);
    await block(auth, 'TODO', 'Implement OAuth login', 1);
    const release = await page('Kế hoạch phát hành');
    await block(release, 'HEADER', 'Checklist phát hành', 0);
    await block(
      release,
      'TEXT',
      'Viết release notes và kiểm tra bản build trên staging',
      1,
    );
    const weekly = await page('Họp tuần');
    const agenda = await block(
      weekly,
      'TEXT',
      'Chốt lịch demo với khách hàng',
      0,
    );

    // Everything below must run on this transaction's connection.
    const dataSource = Object.assign(Object.create(manager) as object, {
      transaction: (work: (m: typeof manager) => Promise<unknown>) =>
        work(manager),
    });
    const store = new PageEmbeddingSqlStore(dataSource as never);
    store.withIndexLock = (work) => work();
    // Only the seeded Pages: the real ones are not touched or embedded.
    const findPagesToIndex = store.findPagesToIndex.bind(store);
    store.findPagesToIndex = async (model, limit) =>
      (await findPagesToIndex(model, 1000))
        .filter((id) => [auth, release, weekly].includes(id))
        .slice(0, limit);

    const embedder = new FastApiAiRuntimeAdapter(
      // axios resolves to its ESM types here and its CommonJS types in
      // @nestjs/axios; the instance is the same.
      new HttpService(
        axios.create() as unknown as ConstructorParameters<
          typeof HttpService
        >[0],
      ),
      new ConfigService(process.env),
    );
    const indexer = new PageEmbeddingIndexer(
      store,
      embedder,
      new ConfigService({}),
    );
    const search = new PageEmbeddingSearch(store, embedder, {
      getReadablePage: (_user: string, pageId: string) =>
        Promise.resolve({
          getWorkspaceId: () => workspaceId,
          getId: () => pageId,
        }),
    } as unknown as AiConversationAccessService);
    const top = async (query: string, resourceType?: 'PAGE' | 'BLOCK') =>
      (
        await search.search({
          userId,
          workspaceId,
          query,
          resourceType,
          limit: 3,
        })
      ).map(
        (match) =>
          ({ [auth]: 'auth', [release]: 'release', [weekly]: 'weekly' })[
            match.pageId
          ],
      );

    let started = performance.now();
    const first = await indexer.runOnce();
    console.log(
      `first run: ${JSON.stringify(first)} in ${(performance.now() - started).toFixed(0)} ms`,
    );
    check('three Pages indexed, 3 PAGE + 5 BLOCK rows', first, {
      removed: 0,
      indexed: 3,
      embedded: 8,
    });
    // Pages read in the last minute are visited again (the read time is a
    // minute early, and frozen inside this transaction); the hash keeps them
    // from being embedded again.
    check('nothing embedded again', (await indexer.runOnce())?.embedded, 0);

    started = performance.now();
    check(
      '"page có nói về OAuth" → auth first',
      (await top('page có nói về OAuth'))[0],
      'auth',
    );
    console.log(`search: ${(performance.now() - started).toFixed(0)} ms`);
    check(
      '"trang chuẩn bị phát hành" (PAGE) → release first',
      (await top('trang chuẩn bị phát hành', 'PAGE'))[0],
      'release',
    );

    // An edit after the last index: only that block is embedded again.
    await manager.query(
      `UPDATE page_blocks SET content = $2, updated_at = localtimestamp + interval '1 second' WHERE id = $1`,
      [agenda, { text: 'Thảo luận chiến dịch quảng cáo Facebook' }],
    );
    check(
      'edited block embedded again, alone',
      (await indexer.runOnce())?.embedded,
      1,
    );
    check(
      '"quảng cáo Facebook" → weekly first',
      (await top('trang nói về quảng cáo Facebook'))[0],
      'weekly',
    );

    // Trash: out of the results at once, vectors removed by the next run.
    await manager.query(
      `UPDATE pages SET deleted_at = localtimestamp WHERE id = $1`,
      [auth],
    );
    check(
      'trashed Page no longer found',
      (await top('page có nói về OAuth')).includes('auth'),
      false,
    );
    check(
      'trashed Page vectors removed',
      (await indexer.runOnce())?.removed,
      1,
    );
    check(
      'no rows left for the trashed Page',
      (
        await manager.query(
          `SELECT count(*)::int AS n FROM page_embeddings WHERE page_id = $1`,
          [auth],
        )
      )[0].n,
      0,
    );
  } finally {
    await runner.rollbackTransaction();
    await runner.release();
    await source.destroy();
  }
}

void main();
