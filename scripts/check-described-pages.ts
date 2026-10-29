/**
 * M6 check (kế hoạch tìm theo mô tả, G7): 20 sentences that describe a Page
 * and 5 that describe none, on ten seeded Pages. Each sentence goes through
 * the running AI service (page intent, then embeddings) and the M6 cut. The
 * Pages are seeded and indexed inside ONE transaction that is rolled back.
 *
 *   npx ts-node -r tsconfig-paths/register scripts/check-described-pages.ts
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

const DESCRIBED: [string, string][] = [
  [
    'Sửa trang dùng để chuẩn bị phát hành sản phẩm: thêm checklist gồm build, test',
    'release',
  ],
  [
    'thêm checklist gồm a, b vào trang về kế hoạch quảng cáo cuối năm',
    'marketing',
  ],
  ['Thêm mục họp vào trang ghi biên bản họp hằng tuần', 'weekly'],
  ['add a checklist to the page about onboarding new staff', 'onboarding'],
  ['thêm việc kiểm tra vào trang theo dõi lỗi của ứng dụng', 'bugs'],
  ['thêm món canh chua vào trang về các món ăn', 'recipes'],
  ['thêm mục ăn uống vào trang về chuyến đi chơi Đà Lạt', 'travel'],
  ['add an endpoint section to the page that covers our REST API', 'api'],
  ['thêm cuốn Sapiens vào trang ghi lại những cuốn sách muốn đọc', 'reading'],
  [
    'thêm việc bật xác thực hai lớp vào trang nói về cải thiện đăng nhập',
    'auth',
  ],
  ['thêm mục rollback vào trang dùng cho việc ra mắt phiên bản mới', 'release'],
  ['thêm KOL mới vào trang liên quan đến ngân sách quảng cáo', 'marketing'],
  ['thêm mục lịch demo vào trang ghi chép các buổi họp nhóm', 'weekly'],
  ['add a laptop item to the page for new employees', 'onboarding'],
  ['thêm lỗi đăng nhập vào trang theo dõi các bug cần sửa', 'bugs'],
  ['add a dessert to the page about cooking recipes', 'recipes'],
  ['thêm chi phí khách sạn vào trang về kế hoạch du lịch', 'travel'],
  ['add the error codes to the page about the API documentation', 'api'],
  ['thêm tiểu thuyết mới vào trang về danh sách sách', 'reading'],
  ['add a token rotation task to the page about login security', 'auth'],
];

const UNRELATED = [
  'thêm tỉ số vào trang về giải bóng đá ngoại hạng Anh',
  'thêm lịch tiêm vào trang theo dõi sức khoẻ thú cưng',
  'add a row to the page about stock market investments',
  'thêm cây mới vào trang về chăm sóc vườn rau',
  'thêm bài tập vào trang ghi lịch tập gym buổi sáng',
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
      const words =
        result.referenceType === 'DESCRIPTION'
          ? result.description
          : result.referenceType === 'TITLE'
            ? result.pageReference
            : null;
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
        best: all[0] ? `${all[0].page.title} ${all[0].score.toFixed(2)}` : '-',
      };
    };

    let found = 0;
    let described = 0;
    for (const [sentence, want] of DESCRIBED) {
      const answer = await offered(sentence);
      const ok = answer.ids.includes(want);
      found += Number(ok);
      described += Number(answer.kind === 'DESCRIPTION');
      console.log(
        `${ok ? 'PASS' : 'FAIL'}  ${answer.kind.padEnd(11)} "${sentence}" → [${answer.pages.join(', ')}]${ok ? '' : ` want ${want}, best ${answer.best}`}`,
      );
    }
    let quiet = 0;
    for (const sentence of UNRELATED) {
      const answer = await offered(sentence);
      quiet += Number(answer.ids.length === 0);
      console.log(
        `${answer.ids.length ? 'FAIL' : 'PASS'}  ${answer.kind.padEnd(11)} "${sentence}" → [${answer.pages.join(', ')}] best ${answer.best}`,
      );
    }
    console.log(
      `\nright Page offered: ${found}/${DESCRIBED.length} (need ≥ 80%); read as a description: ${described}/${DESCRIBED.length}; unrelated left alone: ${quiet}/${UNRELATED.length} (need ≥ 80%)`,
    );
    if (found < 0.8 * DESCRIBED.length || quiet < 0.8 * UNRELATED.length)
      process.exitCode = 1;
  } finally {
    await runner.rollbackTransaction();
    await runner.release();
    await source.destroy();
  }
}

void main();
