/**
 * M8 check (kế hoạch ngữ cảnh RAG, I8): drafts written from a source the user
 * named. Seeds a workspace (Release 2.0, Bug tracker, Ghi chú QA, unrelated
 * Pages) inside ONE transaction that is rolled back, indexes it, then for
 * each sentence: page intent (running AI service) → source passages
 * (PageSourceReferences) → planner (running AI service, real model) with
 * those references. Every drafted item is checked against the passages and
 * the user's words; an item matching neither is counted as invented.
 *
 *   npx ts-node -r tsconfig-paths/register scripts/check-based-on-drafts.ts
 */
import 'reflect-metadata';

import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import source from '../src/database/data-source';
import { AI_MODIFICATION_PLAN_CAPABILITY } from '../src/modules/ai_assistant/application/constants/ai-modification-plan.constant';
import { PageEmbeddingIndexer } from '../src/modules/ai_assistant/application/embedding/page-embedding-indexer.service';
import { PageEmbeddingSearch } from '../src/modules/ai_assistant/application/embedding/page-embedding-search.service';
import {
  PageSourceReferences,
  type PlanReference,
} from '../src/modules/ai_assistant/application/embedding/page-source-references.service';
import type { PageReferenceResolver } from '../src/modules/ai_assistant/application/resolution/page-reference-resolver.service';
import type { AiConversationAccessService } from '../src/modules/ai_assistant/application/services/ai-conversation-access.service';
import { PageEmbeddingSqlStore } from '../src/modules/ai_assistant/infrastructure/embedding/page-embedding.store';
import { FastApiAiRuntimeAdapter } from '../src/modules/ai_assistant/infrastructure/runtime/fast-api-ai-runtime.adapter';

const PAGES: { title: string; blocks: [string, string][] }[] = [
  { title: 'Release 2.0', blocks: [['HEADER', 'Kế hoạch phát hành']] },
  {
    title: 'Bug tracker',
    blocks: [
      ['HEADER', 'Bug blocker'],
      ['TODO', 'Ứng dụng bị crash khi tải ảnh lớn'],
      ['TODO', 'Không gửi được email xác nhận đăng ký'],
      ['TODO', 'Trang thanh toán hiển thị sai giá'],
      ['HEADER', 'Lỗi nhỏ'],
      ['TODO', 'Nút Lưu bị lệch màu'],
      ['TODO', 'Sai chính tả ở trang giới thiệu'],
    ],
  },
  {
    title: 'Ghi chú QA',
    blocks: [
      ['TEXT', 'QA: đăng nhập trên Safari bị treo khi bật chế độ riêng tư'],
      ['TEXT', 'QA: cần kiểm thử lại luồng thanh toán sau khi sửa giá'],
      ['TEXT', 'QA: trang chủ tải chậm khoảng 4 giây trên mạng 3G'],
      ['TEXT', 'QA: chưa có kiểm thử cho tính năng xuất PDF'],
    ],
  },
  {
    title: 'Công thức nấu ăn',
    blocks: [['TEXT', 'Phở bò: hầm xương 8 tiếng']],
  },
  {
    title: 'Du lịch Đà Lạt',
    blocks: [['TEXT', 'Thuê xe máy 150 nghìn một ngày']],
  },
];

const SENTENCES = [
  'thêm checklist các bug blocker vào trang Release 2.0 dựa trên trang Bug tracker',
  'thêm checklist các lỗi cần sửa vào trang Release 2.0 dựa trên trang "Bug tracker"',
  'thêm mục rủi ro vào trang Release 2.0 dựa trên ghi chú QA',
  'thêm checklist kiểm thử vào trang Release 2.0 dựa trên ghi chú QA gần đây',
  'thêm checklist các việc QA còn thiếu vào trang Release 2.0, căn cứ vào trang Ghi chú QA',
  'thêm checklist vào trang Release 2.0 dựa trên trang Bug tracker',
  'thêm mục lỗi thanh toán vào trang Release 2.0 dựa trên trang Bug tracker',
  'thêm checklist kiểm tra hiệu năng vào trang Release 2.0 theo nội dung của trang Ghi chú QA',
  'thêm checklist các bug blocker vào trang Release 2.0 dựa trên báo cáo lỗi ứng dụng',
  'thêm checklist các lỗi nhỏ vào trang Release 2.0 dựa trên trang Bug tracker',
];
const NOWHERE =
  'thêm checklist vào trang Release 2.0 dựa trên giải bóng đá ngoại hạng Anh';
const BASELINE = [0, 2, 6];

const words = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/giu, 'd')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 1 && !FILLER.has(word));

// Words every sentence has: "bị" in "bị crash" must not ground "chuẩn bị".
const FILLER = new Set(
  'bi cac cho khi tren trong cua la de co khong duoc voi sau lai va mot nhung the and of to in on for qa'.split(
    ' ',
  ),
);

/**
 * An item is grounded when most of its words are in one passage (helped by the
 * request), with at least half of them from the passage itself.
 */
function grounded(
  item: string,
  passages: string[],
  request: string,
): 'SOURCE' | 'REQUEST' | 'INVENTED' {
  const own = words(item);
  if (!own.length) return 'REQUEST';
  const share = (text: string) => {
    const pool = new Set(words(text));
    return own.filter((word) => pool.has(word)).length / own.length;
  };
  if (
    passages.some(
      (passage) =>
        share(`${passage} ${request}`) >= 0.6 && share(passage) >= 0.5,
    )
  )
    return 'SOURCE';
  return share(request) >= 0.6 ? 'REQUEST' : 'INVENTED';
}

function itemsOf(plan: unknown): string[] {
  const operations =
    (plan as { operations?: { blocks?: { content?: { text?: string } }[] }[] })
      .operations ?? [];
  return operations.flatMap((operation) =>
    (operation.blocks ?? [])
      .map((block) => block.content?.text ?? '')
      .filter(Boolean),
  );
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
    const userId = await insert(
      `INSERT INTO users (email, username) VALUES ($1, $2) RETURNING id`,
      [`bench-${tag}@example.test`, `bench_${tag}`],
    );
    const workspaceId = await insert(
      `INSERT INTO workspaces (name, slug, created_by) VALUES ($1, $2, $3) RETURNING id`,
      ['Bench', `bench-${tag}`, userId],
    );
    const ids = new Map<string, string>();
    for (const [index, seed] of PAGES.entries()) {
      const pageId = await insert(
        `INSERT INTO pages (workspace_id, title, created_by, public_subdomain)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [workspaceId, seed.title, userId, `p${index}-${tag}`],
      );
      ids.set(seed.title, pageId);
      for (const [order, [type, text]] of seed.blocks.entries())
        await insert(
          `INSERT INTO page_blocks (page_id, type, content, order_index, created_by)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [pageId, type, { text }, order, userId],
        );
    }
    const titleOf = new Map([...ids].map(([title, id]) => [id, title]));
    const target = ids.get('Release 2.0')!;

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
        .filter((id) => titleOf.has(id))
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
    while ((await indexer.runOnce())?.embedded) {
      // until every seeded Page is indexed
    }
    const search = new PageEmbeddingSearch(store, runtime, {
      getReadablePage: (_user: string, pageId: string) =>
        Promise.resolve({
          getId: () => pageId,
          getWorkspaceId: () => workspaceId,
          getTitle: () => titleOf.get(pageId),
          getParentPageId: () => null,
          getTeamspaceId: () => null,
        }),
    } as unknown as AiConversationAccessService);
    // Exact titles of the seeded workspace (access is tested in the specs).
    const resolver = {
      resolve: ({ title }: { title: string }) => {
        const pageId = ids.get(title);
        return Promise.resolve(
          pageId
            ? { status: 'RESOLVED', page: { pageId, title } }
            : { status: 'NOT_FOUND', candidates: [] },
        );
      },
    } as unknown as PageReferenceResolver;
    const references = new PageSourceReferences(resolver, store, search);

    const context = {
      schemaVersion: 1,
      builtAt: new Date().toISOString(),
      page: {
        id: target,
        workspaceId,
        teamspaceId: null,
        parentPageId: null,
        title: 'Release 2.0',
        icon: null,
        coverUrl: null,
        updatedAt: new Date().toISOString(),
      },
      blocks: [
        {
          id: randomUUID(),
          parentBlockId: null,
          type: 'HEADER',
          orderIndex: 0,
          title: null,
          content: { text: 'Kế hoạch phát hành' },
          styleConfig: { level: 1 },
          dataConfig: null,
        },
      ],
      databaseReferences: [],
      databases: [],
      completeness: {
        blocks: { total: 1, included: 1, truncated: false },
        databases: { total: 0, included: 0, truncated: false },
        rows: [],
        textTruncated: false,
      },
    };
    const plan = async (instruction: string, passages?: PlanReference[]) => {
      const started = performance.now();
      const result = await runtime.execute({
        requestId: randomUUID(),
        capability: AI_MODIFICATION_PLAN_CAPABILITY,
        content: instruction,
        input: passages ? { references: passages } : {},
        context,
      });
      return { output: result.output, ms: performance.now() - started };
    };

    let used = 0;
    let invented = 0;
    const timesWith: number[] = [];
    const timesWithout: number[] = [];
    // The same sentences with and without references, for the time check.
    const withBySentence: Record<number, number> = {};
    for (const [index, sentence] of SENTENCES.entries()) {
      const { result } = await runtime.extract(sentence);
      if (result.intent !== 'MODIFY_PAGE' || !result.basedOn) {
        console.log(
          `FAIL  no source read from "${sentence}" (${result.referenceType})`,
        );
        continue;
      }
      const found = await references.collect({
        userId,
        workspaceId,
        basedOn: result.basedOn,
        targetPageId: target,
      });
      if (found.status !== 'FOUND') {
        console.log(`FAIL  no passage for "${result.basedOn}"`);
        continue;
      }
      let drafted: Awaited<ReturnType<typeof plan>>;
      try {
        drafted = await plan(result.instruction, found.references);
      } catch (error) {
        console.log(
          `FAIL  "${sentence}" → planner error ${error instanceof Error ? error.message : 'unknown'}`,
        );
        continue;
      }
      timesWith.push(drafted.ms);
      const status = (drafted.output as { status?: string }).status;
      const items = itemsOf(drafted.output);
      const marks = items.map(
        (item) =>
          [
            item,
            grounded(
              item,
              found.references.map((r) => r.text),
              sentence,
            ),
          ] as const,
      );
      const fromSource = marks.some(([, mark]) => mark === 'SOURCE');
      const made = marks.filter(([, mark]) => mark === 'INVENTED').length;
      used += Number(fromSource);
      invented += made;
      console.log(
        `${fromSource && !made ? 'PASS' : 'FAIL'}  "${sentence}"\n      basedOn="${result.basedOn}" sources=[${found.sources.map((s) => s.title).join(', ')}] passages=${found.references.length} ${status} ${(drafted.ms / 1000).toFixed(1)}s`,
      );
      for (const [item, mark] of marks)
        console.log(`      ${mark.padEnd(8)} ${item}`);
      if (BASELINE.includes(index)) {
        const plain = await plan(result.instruction).catch(() => null);
        if (!plain) continue;
        withBySentence[index] = drafted.ms;
        timesWithout.push(plain.ms);
        console.log(
          `      without references: ${(plain.output as { status?: string }).status} ${(plain.ms / 1000).toFixed(1)}s`,
        );
      }
    }

    const { result } = await runtime.extract(NOWHERE);
    const nowhere =
      result.intent === 'MODIFY_PAGE' && result.basedOn
        ? await references.collect({
            userId,
            workspaceId,
            basedOn: result.basedOn,
            targetPageId: target,
          })
        : { status: 'NO_SOURCE' };
    console.log(
      `${nowhere.status === 'NOT_FOUND' ? 'PASS' : 'FAIL'}  "${NOWHERE}" → ${nowhere.status} (planner not called)`,
    );

    const average = (values: number[]) =>
      values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1);
    const baselineWith = average(Object.values(withBySentence));
    console.log(
      `\ndrafts using the source: ${used}/${SENTENCES.length} (need ≥ 8); invented items: ${invented} (need 0); ` +
        `planner ${(baselineWith / 1000).toFixed(1)}s with references vs ${(average(timesWithout) / 1000).toFixed(1)}s without (same sentences)`,
    );
  } finally {
    await runner.rollbackTransaction();
    await runner.release();
    await source.destroy();
  }
}

void main();
