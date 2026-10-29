/**
 * M4 check (kế hoạch lọc theo cấu trúc): ancestors and teamspace of Pages,
 * and narrowing two "Tasks" Pages to a named place, on the configured
 * database. Seeds inside ONE transaction and rolls it back.
 *
 *   npx ts-node -r tsconfig-paths/register scripts/check-page-places.ts
 */
import 'reflect-metadata';

import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import source from '../src/database/data-source';
import type { AiConversationAccessService } from '../src/modules/ai_assistant/application/services/ai-conversation-access.service';
import { PageReferenceResolver } from '../src/modules/ai_assistant/application/resolution/page-reference-resolver.service';
import type { PageResolutionCandidate } from '../src/modules/ai_assistant/application/resolution/page-resolution.types';
import { PageExactResolutionReader } from '../src/modules/ai_assistant/infrastructure/resolution/page-exact-resolution.reader';
import type { PageRepository } from '../src/modules/content/domain/repositories/page.repository';

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
    const marketing = await insert(
      `INSERT INTO teamspaces (workspace_id, name, slug, created_by) VALUES ($1, 'Marketing', $2, $3) RETURNING id`,
      [workspaceId, `marketing-${tag}`, userId],
    );
    const root = (title: string, teamspace: string | null) =>
      insert(
        `INSERT INTO pages (workspace_id, title, created_by, public_subdomain, teamspace_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          workspaceId,
          title,
          userId,
          `${title.replace(/\W+/g, '-').toLowerCase()}-${tag}`,
          teamspace,
        ],
      );
    const child = (title: string, parent: string, teamspace: string | null) =>
      insert(
        `INSERT INTO pages (workspace_id, title, created_by, parent_page_id, teamspace_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [workspaceId, title, userId, parent, teamspace],
      );
    // Dự án A › Sprint 12 › Tasks (in Marketing); Dự án B › Tasks.
    const projectA = await root('Dự án A', marketing);
    const sprint = await child('Sprint 12', projectA, marketing);
    const tasksA = await child('Tasks', sprint, marketing);
    const projectB = await root('Dự án B', null);
    const tasksB = await child('Tasks', projectB, null);

    const reader = new PageExactResolutionReader({} as PageRepository, source);
    // The reader must run inside this transaction to see the seeded rows.
    (reader as unknown as { dataSource: unknown }).dataSource = manager;
    const resolver = new PageReferenceResolver(
      reader,
      {} as AiConversationAccessService,
    );

    const places = await reader.findPagePlaces([tasksA, tasksB]);
    check(
      'ancestors of Tasks A (any depth)',
      [...(places.get(tasksA)?.ancestorTitles ?? [])].sort(),
      ['Dự án A', 'Sprint 12'],
    );
    check(
      'teamspace of Tasks A',
      places.get(tasksA)?.teamspaceName,
      'Marketing',
    );
    check('ancestors of Tasks B', places.get(tasksB)?.ancestorTitles, [
      'Dự án B',
    ]);
    check('no teamspace for Tasks B', places.get(tasksB)?.teamspaceName, null);

    const candidates: PageResolutionCandidate[] = [tasksA, tasksB].map(
      (pageId) => ({
        pageId,
        workspaceId,
        title: 'Tasks',
        parentPageId: null,
        teamspaceId: null,
      }),
    );
    const narrowed = async (
      parentTitle: string | null,
      teamspaceName: string | null,
    ) =>
      (
        await resolver.filterByScope(candidates, { parentTitle, teamspaceName })
      ).map((page) => (page.pageId === tasksA ? 'A' : 'B'));
    check('trong trang Dự án A', await narrowed('Dự án A', null), ['A']);
    check('của dự án B', await narrowed('dự án B', null), ['B']);
    check('trong trang Sprint 12', await narrowed('Sprint 12', null), ['A']);
    check('trong teamspace Marketing', await narrowed(null, 'Marketing'), [
      'A',
    ]);
    check('trong trang Dự án C', await narrowed('Dự án C', null), []);

    // A deleted ancestor no longer places a Page.
    await manager.query(`UPDATE pages SET deleted_at = now() WHERE id = $1`, [
      sprint,
    ]);
    check(
      'deleted ancestor is ignored',
      (await reader.findPagePlaces([tasksA])).get(tasksA)?.ancestorTitles,
      ['Dự án A'],
    );

    const started = performance.now();
    for (let index = 0; index < 50; index++)
      await reader.findPagePlaces([tasksA, tasksB]);
    console.log(
      `places query: ${((performance.now() - started) / 50).toFixed(2)} ms on average`,
    );
  } finally {
    await runner.rollbackTransaction();
    await runner.release();
    await source.destroy();
  }
}

void main();
