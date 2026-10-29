/**
 * M1 benchmark: how long finding a Page by name takes in a 5,000-Page
 * workspace. Seeds everything inside ONE transaction on the configured
 * database and rolls it back, so nothing is left behind.
 *
 *   npx ts-node -r tsconfig-paths/register scripts/bench-page-resolution.ts
 */
import 'reflect-metadata';

import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import source from '../src/database/data-source';
import { PageOrmEntity } from '../src/modules/content/infrastructure/persistence/typeorm/entities/page.orm-entity';
import { TypeOrmPageRepository } from '../src/modules/content/infrastructure/persistence/typeorm/repositories/typeorm-page.repository';
import { findPageTitlesInSentence } from '../src/modules/ai_assistant/application/resolution/page-title-sentence-matcher';
import {
  SIMILAR_TITLE_THRESHOLD,
  titleSimilarity,
} from '../src/modules/ai_assistant/application/resolution/page-title-similarity';
import { PageExactResolutionReader } from '../src/modules/ai_assistant/infrastructure/resolution/page-exact-resolution.reader';

const PAGES = 5000;
const RUNS = 50;
const WARMUP = 5;

const PREFIXES = [
  'Kế hoạch',
  'Báo cáo',
  'Họp',
  'Ghi chú',
  'Dự án',
  'Tài liệu',
  'Quy trình',
  'Danh sách',
  'Release',
  'Sprint',
];
const TOPICS = [
  'marketing',
  'tuyển dụng',
  'ngân sách',
  'sản phẩm',
  'khách hàng',
  'đội ngũ',
  'kỹ thuật',
  'bán hàng',
  'đào tạo',
  'chính sách',
  'dịch vụ',
  'hợp đồng',
  'thiết kế',
  'kiểm thử',
  'vận hành',
  'tài chính',
  'onboarding',
  'roadmap',
  'QA',
  'backend',
  'frontend',
  'mobile',
  'data',
  'bảo mật',
  'pháp lý',
];

/** Varied Vietnamese titles, some repeated, plus the names the sentences use. */
function titles(): string[] {
  const result = ['sub man', 'Hội họp tuần', 'Hội họp tuần', 'Phát hành 2.0'];
  for (let index = 0; result.length < PAGES - 1; index++) {
    const prefix = PREFIXES[index % PREFIXES.length];
    const topic = TOPICS[Math.floor(index / PREFIXES.length) % TOPICS.length];
    result.push(`${prefix} ${topic} ${Math.floor(index / 250) + 1}`);
  }
  return result;
}

function stats(samples: number[]): string {
  const sorted = [...samples].sort((a, b) => a - b);
  const at = (q: number) =>
    sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  return `p50 ${at(0.5).toFixed(1)} ms  p95 ${at(0.95).toFixed(1)} ms`;
}

async function measure(
  name: string,
  run: () => Promise<number>,
): Promise<void> {
  let found = 0;
  for (let index = 0; index < WARMUP; index++) found = await run();
  const samples: number[] = [];
  for (let index = 0; index < RUNS; index++) {
    const started = performance.now();
    found = await run();
    samples.push(performance.now() - started);
  }
  console.log(`${name.padEnd(48)} ${stats(samples)}  (${found} found)`);
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
    const memberId = await insert(
      `INSERT INTO workspace_members (workspace_id, user_id, membership_type, role_name)
       VALUES ($1, $2, 'MEMBER', 'MEMBER') RETURNING id`,
      [workspaceId, userId],
    );
    const teamspace = (name: string) =>
      insert(
        `INSERT INTO teamspaces (workspace_id, name, slug, created_by) VALUES ($1, $2, $3, $4) RETURNING id`,
        [workspaceId, name, `${name}-${tag}`, userId],
      );
    const joined = await teamspace('joined');
    const other = await teamspace('other');
    await manager.query(
      `INSERT INTO teamspace_members (teamspace_id, workspace_member_id) VALUES ($1, $2)`,
      [joined, memberId],
    );

    // Only a root Page has a public subdomain: one root, everything else below it.
    const rootId = await insert(
      `INSERT INTO pages (workspace_id, title, created_by, public_subdomain)
       VALUES ($1, 'Bench root', $2, $3) RETURNING id`,
      [workspaceId, userId, `bench-${tag}`],
    );
    const names = titles();
    // About 10% in a joined teamspace, 2% in one the user is not a member of.
    const teamspaces = names.map((_, index) =>
      index % 50 === 7 ? other : index % 10 === 3 ? joined : null,
    );
    await manager.query(
      `INSERT INTO pages (workspace_id, title, created_by, parent_page_id, teamspace_id)
       SELECT $1, title, $2, $3, teamspace FROM unnest($4::text[], $5::uuid[]) AS t(title, teamspace)`,
      [workspaceId, userId, rootId, names, teamspaces],
    );
    console.log(
      `Seeded ${names.length + 1} Pages in one transaction (rolled back at the end).`,
    );

    const repository = new TypeOrmPageRepository(
      manager.getRepository(PageOrmEntity),
    );
    const reader = new PageExactResolutionReader(repository, source);

    await measure(
      'exact title "Hội họp tuần"',
      async () =>
        (
          await reader.findAccessibleByExactTitle(
            userId,
            workspaceId,
            'Hội họp tuần',
          )
        ).length,
    );
    await measure(
      'exact title that does not exist',
      async () =>
        (
          await reader.findAccessibleByExactTitle(
            userId,
            workspaceId,
            'Không tồn tại',
          )
        ).length,
    );
    for (const sentence of [
      'xoá Gửi email trong trang sub man',
      'thêm checklist vào trang hoi hop tuan',
      'add a QA checklist to Sprint QA 3 page',
      'thêm checklist gồm a, b',
    ]) {
      await measure(
        `sentence: ${sentence}`,
        async () =>
          findPageTitlesInSentence(
            sentence,
            await reader.findAccessibleTitlesInWorkspace(userId, workspaceId),
          ).length,
      );
    }
    // M3: every title scored against a typed name that matched nothing.
    for (const typed of ['relese 2', 'Hoi hp tuan', 'xyz abc']) {
      await measure(
        `similar titles: ${typed}`,
        async () =>
          (
            await reader.findAccessibleTitlesInWorkspace(userId, workspaceId)
          ).filter(
            (page) =>
              titleSimilarity(typed, page.title) >= SIMILAR_TITLE_THRESHOLD,
          ).length,
      );
    }
  } finally {
    await runner.rollbackTransaction();
    await runner.release();
    await source.destroy();
  }
}

void main();
