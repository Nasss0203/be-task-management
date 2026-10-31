/**
 * M7 check (kế hoạch tìm theo nội dung, H7): 20 sentences that name a Page by
 * words inside it and 5 whose words are in no Page, on ten seeded Pages. Each
 * sentence goes through the running AI service (page intent, then
 * embeddings) and the M6 cut; an offered Page found by a block must show
 * that block's words. Seeded and indexed in ONE transaction, rolled back.
 *
 *   npx ts-node -r tsconfig-paths/register scripts/check-content-pages.ts
 */
import 'reflect-metadata';

import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import source from '../src/database/data-source';
import {
  describedPageMatches,
  DESCRIBED_PAGE_SEARCH_LIMIT,
} from '../src/modules/ai_assistant/application/embedding/described-page-candidates';
import { PageEmbeddingIndexer } from '../src/modules/ai_assistant/application/embedding/page-embedding-indexer.service';
import { PageEmbeddingSearch } from '../src/modules/ai_assistant/application/embedding/page-embedding-search.service';
import type { AiConversationAccessService } from '../src/modules/ai_assistant/application/services/ai-conversation-access.service';
import { PageEmbeddingSqlStore } from '../src/modules/ai_assistant/infrastructure/embedding/page-embedding.store';
import { FastApiAiRuntimeAdapter } from '../src/modules/ai_assistant/infrastructure/runtime/fast-api-ai-runtime.adapter';

interface SeedPage {
  id: string;
  title: string;
  headers: string[];
  blocks: string[];
}

// Pages of the M5 model comparison (ai-taskmanly/evaluation/embedding_cases.json).
const PAGES = (
  JSON.parse(
    readFileSync(
      join(__dirname, '../../ai-taskmanly/evaluation/embedding_cases.json'),
      'utf8',
    ),
  ) as { pages: SeedPage[] }
).pages;

const CONTENT: [string, string][] = [
  // plan-v2 M7: "Authentication Improvements" for "page có nói về OAuth".
  ['thêm checklist gồm test, review vào page có nói về OAuth', 'auth'],
  ['Tìm page có nói về OAuth rồi thêm checklist gồm test, review', 'auth'],
  ['tìm trang có nhắc tới refresh token, thêm checklist gồm a, b', 'auth'],
  ['thêm checklist gồm a, b vào trang có nhắc tới đóng băng code', 'release'],
  ['thêm việc vào trang có chứa release notes', 'release'],
  ['tìm trang có ghi tiến độ sprint rồi thêm checklist gồm a, b', 'weekly'],
  ['thêm việc gọi khách vào trang có nhắc tới lịch demo', 'weekly'],
  [
    'thêm checklist gồm a, b vào trang có nhắc tới quảng cáo Facebook',
    'marketing',
  ],
  ['thêm việc vào trang có chứa ngân sách 50 triệu', 'marketing'],
  ['tìm trang có nói về cấp laptop rồi thêm checklist gồm a, b', 'onboarding'],
  ['thêm checklist gồm a, b vào trang có nhắc tới ứng dụng bị crash', 'bugs'],
  ['thêm việc vào trang có ghi lỗi email xác nhận', 'bugs'],
  ['thêm món canh vào trang có nhắc tới phở bò', 'recipes'],
  ['thêm việc mua trứng vào trang có chứa bánh flan', 'recipes'],
  ['thêm việc đặt vé vào trang có nhắc tới hồ Xuân Hương', 'travel'],
  ['thêm checklist gồm a, b vào trang có nói về thuê xe máy', 'travel'],
  ['add a QA checklist to the page that mentions rate limiting', 'api'],
  ['find the page that mentions error codes and add a checklist', 'api'],
  ['thêm sách mới vào trang có nhắc tới Nhà giả kim', 'reading'],
  ['add a note to the page that mentions Atomic Habits', 'reading'],
];

const UNRELATED = [
  'thêm checklist gồm a, b vào trang có nhắc tới giải bóng đá ngoại hạng Anh',
  'thêm việc vào trang có chứa lịch tiêm cho mèo',
  'add a checklist to the page that mentions Kubernetes clusters',
  'tìm trang có nói về chăm sóc vườn rau rồi thêm checklist gồm a, b',
  'thêm việc vào trang có nhắc tới bài tập gym buổi sáng',
];

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
    const userId = await insert(
      `INSERT INTO users (email, username) VALUES ($1, $2) RETURNING id`,
      [`bench-${tag}@example.test`, `bench_${tag}`],
    );
    const workspaceId = await insert(
      `INSERT INTO workspaces (name, slug, created_by) VALUES ($1, $2, $3) RETURNING id`,
      ['Bench', `bench-${tag}`, userId],
    );
    const seeded = new Map<string, string>();
    for (const seed of PAGES) {
      const pageId = await insert(
        `INSERT INTO pages (workspace_id, title, created_by, public_subdomain)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [workspaceId, seed.title, userId, `${seed.id}-${tag}`],
      );
      seeded.set(pageId, seed.id);
      const texts = [
        ...seed.headers.map((text) => ['HEADER', text]),
        ...seed.blocks.map((text) => ['TEXT', text]),
      ];
      for (const [index, [type, text]] of texts.entries())
        await insert(
          `INSERT INTO page_blocks (page_id, type, content, order_index, created_by)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [pageId, type, { text }, index, userId],
        );
    }

    // Everything below must run on this transaction's connection.
    const dataSource = Object.assign(Object.create(manager) as object, {
      transaction: (work: (m: typeof manager) => Promise<unknown>) =>
        work(manager),
    });
    const store = new PageEmbeddingSqlStore(dataSource as never);
    store.withIndexLock = (work) => work();
    const findPagesToIndex = store.findPagesToIndex.bind(store);
    store.findPagesToIndex = async (model, limit) =>
      (await findPagesToIndex(model, 1000))
        .filter((id) => seeded.has(id))
        .slice(0, limit);
    const runtime = new FastApiAiRuntimeAdapter(
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
      runtime,
      new ConfigService({}),
    );
    // Pages read in the last minute are visited again (the read time is a
    // minute early and frozen in this transaction): stop once nothing new
    // is embedded.
    while ((await indexer.runOnce())?.embedded) {
      // until every seeded Page is indexed
    }
    const search = new PageEmbeddingSearch(store, runtime, {
      getReadablePage: (_user: string, pageId: string) =>
        Promise.resolve({
          getId: () => pageId,
          getWorkspaceId: () => workspaceId,
          getTitle: () => seeded.get(pageId),
          getParentPageId: () => null,
          getTeamspaceId: () => null,
        }),
    } as unknown as AiConversationAccessService);

    const offered = async (sentence: string) => {
      const { result } = await runtime.extract(sentence);
      const words = result.referenceType === 'CONTENT' ? result.topic : null;
      const all = words
        ? await search.search({
            userId,
            workspaceId,
            query: words,
            limit: DESCRIBED_PAGE_SEARCH_LIMIT,
          })
        : [];
      const pages = describedPageMatches(all);
      return {
        kind: result.referenceType,
        words,
        pages: pages.map(
          (match) => `${match.page.title} ${match.score.toFixed(2)}`,
        ),
        ids: pages.map((match) => match.page.title),
        // Every excerpt must be the words of a block of the Page it explains.
        excerptsRight: pages.every(
          (match) =>
            match.excerpt === null ||
            PAGES.find((seed) => seed.id === match.page.title)!
              .blocks.concat(
                PAGES.find((seed) => seed.id === match.page.title)!.headers,
              )
              .includes(match.excerpt),
        ),
        excerpts: pages.map((match) => match.excerpt ?? '-'),
        best: all[0] ? `${all[0].page.title} ${all[0].score.toFixed(2)}` : '-',
      };
    };

    let found = 0;
    let recognised = 0;
    let excerptsRight = 0;
    for (const [sentence, want] of CONTENT) {
      const answer = await offered(sentence);
      const ok = answer.ids.includes(want);
      found += Number(ok);
      recognised += Number(answer.kind === 'CONTENT');
      excerptsRight += Number(answer.excerptsRight);
      console.log(
        `${ok ? 'PASS' : 'FAIL'}  ${answer.kind.padEnd(9)} "${sentence}" → [${answer.pages.join(', ')}] ${JSON.stringify(answer.excerpts)}${ok ? '' : ` want ${want}, best ${answer.best}`}`,
      );
    }
    let quiet = 0;
    for (const sentence of UNRELATED) {
      const answer = await offered(sentence);
      quiet += Number(answer.ids.length === 0);
      console.log(
        `${answer.ids.length ? 'FAIL' : 'PASS'}  ${answer.kind.padEnd(9)} "${sentence}" → [${answer.pages.join(', ')}] best ${answer.best}`,
      );
    }
    console.log(
      `\nright Page offered: ${found}/${CONTENT.length} (need ≥ 80%); read as content: ${recognised}/${CONTENT.length}; excerpts right: ${excerptsRight}/${CONTENT.length}; unrelated left alone: ${quiet}/${UNRELATED.length} (need ≥ 80%)`,
    );
    if (
      found < 0.8 * CONTENT.length ||
      quiet < 0.8 * UNRELATED.length ||
      excerptsRight < CONTENT.length
    )
      process.exitCode = 1;
  } finally {
    await runner.rollbackTransaction();
    await runner.release();
    await source.destroy();
  }
}

void main();
