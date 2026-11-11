/**
 * Bộ đo đầu-cuối (prompt 2026-11-10/05): how NestJS treats a sentence after
 * the AI service has read it. The real AiPageInstructionPlannerService runs
 * with three stand-ins (the FastAPI page intent, a resolver that finds the one
 * sample Page, a planner that applies admittedModificationKind and
 * OPERATIONS_OF_KIND to the FastAPI plan). No database, no network.
 *
 *   npx ts-node -T -r tsconfig-paths/register scripts/ai-admission-probe.ts <in.json> <out.json>
 *
 * in.json: [{ id, instruction, pageTitle, pages?, currentPageId?, pageIntent, plan? }
 *           | { id, kind: 'writing', instruction, selectedText, intent }]
 * out.json: { [id]: { stage, status, reason?, kind?, pageTitle? } | { source } }
 */
import 'reflect-metadata';

import { readFileSync, writeFileSync } from 'node:fs';
import { AiModificationPlannerService } from '../src/modules/ai_assistant/application/services/ai-modification-planner.service';
import {
  admittedModificationKind,
  OPERATIONS_OF_KIND,
} from '../src/modules/ai_assistant/application/services/ai-modification-operation.policy';
import { AiPageInstructionPlannerService } from '../src/modules/ai_assistant/application/services/ai-page-instruction-planner.service';
import { resolveWritingSource } from '../src/modules/ai_assistant/application/services/ai-writing-source';
import { PageIntentExtractionService } from '../src/modules/ai_assistant/application/resolution/page-intent-extraction.service';
import { PageReferenceResolver } from '../src/modules/ai_assistant/application/resolution/page-reference-resolver.service';
import {
  findPageTitlesInSentence,
  normalizeForTitleMatch,
} from '../src/modules/ai_assistant/application/resolution/page-title-sentence-matcher';

interface ProbePage {
  id: string;
  title: string;
}

interface ProbeCase {
  id: string;
  instruction: string;
  pageTitle: string;
  pages?: ProbePage[];
  currentPageId?: string;
  pageIntent: Record<string, unknown>;
  plan?: { status: string; operations?: { type: string }[] };
}

interface ProbeWritingCase {
  id: string;
  kind: 'writing';
  instruction: string;
  selectedText: string | null;
  intent: Record<string, unknown>;
}

interface ProbeResult {
  stage: 'admitted' | 'refused' | 'clarify' | 'error';
  status: string;
  reason?: string;
  kind?: string | null;
  pageTitle?: string;
}

const PAGE_ID = '00000000-0000-4000-8000-000000000001';
const EDITED_PAGE = 'Edited page';

class PlannerRefused extends Error {}

export function probeWriting(item: ProbeWritingCase): {
  source: { text: string; language?: string } | null;
} {
  return {
    source: resolveWritingSource(
      item.instruction,
      item.selectedText,
      item.intent as unknown as Parameters<typeof resolveWritingSource>[2],
    ),
  };
}

export async function probe(item: ProbeCase): Promise<ProbeResult> {
  let refusal: ProbeResult | null = null;
  let kind: string | null = null;
  let plannedPageId: string | null = null;
  const pages = item.pages ?? [{ id: PAGE_ID, title: item.pageTitle }];
  const page = (known: ProbePage) => ({
    pageId: known.id,
    workspaceId: 'workspace-1',
    title: known.title,
    parentPageId: null,
    teamspaceId: null,
  });
  const titled = (title: string) =>
    pages.filter(
      (known) =>
        normalizeForTitleMatch(known.title) === normalizeForTitleMatch(title),
    );
  const resolved = (found: ProbePage) => ({
    status: 'RESOLVED',
    page: page(found),
    resolutionMethod: 'EXACT_TITLE',
    confidence: 1,
  });
  const notFound = { status: 'NOT_FOUND', candidates: [] };
  const resolver = {
    resolve: (input: { title?: string }) => {
      if (input.title === undefined) {
        const open = item.pages
          ? pages.find((known) => known.id === item.currentPageId)
          : pages[0];
        return Promise.resolve(open ? resolved(open) : notFound);
      }
      const found = titled(input.title);
      if (found.length > 1)
        return Promise.resolve({
          status: 'AMBIGUOUS',
          candidates: found.map(page),
        });
      return Promise.resolve(found[0] ? resolved(found[0]) : notFound);
    },
    resolveFromSentence: (input: { instruction: string }) => {
      const ids = findPageTitlesInSentence(input.instruction, pages);
      return Promise.resolve(
        ids.length
          ? {
              status: 'CANDIDATES',
              candidates: pages
                .filter((known) => ids.includes(known.id))
                .map(page),
              resolutionMethod: 'TITLE_IN_SENTENCE',
            }
          : notFound,
      );
    },
    resolveSimilarTitles: () => Promise.resolve(notFound),
    resolveFromActivity: () =>
      Promise.resolve({
        status: 'FOUND',
        candidates: [page({ id: PAGE_ID, title: EDITED_PAGE })],
      }),
    filterByScope: (_input: unknown, candidates: unknown) =>
      Promise.resolve(candidates),
  };
  const planner = {
    generate: (params: {
      pageId: string;
      instruction: string;
      references?: unknown[];
    }): Promise<Record<string, unknown>> => {
      plannedPageId = params.pageId;
      kind = admittedModificationKind(params.instruction, [], {
        itemsFromSource: !!params.references?.length,
      });
      if (!kind) {
        refusal = { stage: 'refused', status: 'PLANNER_ADMISSION', kind };
        throw new PlannerRefused();
      }
      const allowed =
        OPERATIONS_OF_KIND[kind as keyof typeof OPERATIONS_OF_KIND];
      const operations = item.plan?.operations ?? [];
      if (operations.some((operation) => !allowed.includes(operation.type))) {
        refusal = { stage: 'refused', status: 'OPERATION_KIND', kind };
        throw new PlannerRefused();
      }
      return Promise.resolve({
        pageId: params.pageId,
        status:
          item.plan?.status === 'NEED_MORE_CONTEXT'
            ? 'NEED_MORE_CONTEXT'
            : 'PLAN_READY',
        generationId: 'generation-1',
        conversationId: 'conversation-1',
      });
    },
  };
  const service = new AiPageInstructionPlannerService(
    {
      extract: () => Promise.resolve({ result: item.pageIntent }),
    } as unknown as PageIntentExtractionService,
    resolver as unknown as PageReferenceResolver,
    planner as unknown as AiModificationPlannerService,
  );
  try {
    const result = await service.generate({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      requestId: `probe-${item.id}`,
      instruction: item.instruction,
      ...(item.currentPageId ? { currentPageId: item.currentPageId } : {}),
      ...(item.pageIntent.referenceType === 'ACTIVITY'
        ? { selectedPageId: PAGE_ID }
        : {}),
    });
    const status = String(result.status);
    const reason =
      'reason' in result && result.reason ? String(result.reason) : undefined;
    if (status === 'PLAN_GENERATED' || status === 'PLAN_NEEDS_MORE_CONTEXT')
      return {
        stage: 'admitted',
        status,
        kind,
        pageTitle:
          pages.find((known) => known.id === plannedPageId)?.title ??
          EDITED_PAGE,
      };
    if (status === 'UNSUPPORTED_OPERATION')
      return { stage: 'refused', status, reason, kind };
    return { stage: 'clarify', status, reason, kind };
  } catch (error) {
    if (error instanceof PlannerRefused && refusal) return refusal;
    return {
      stage: 'error',
      status: error instanceof Error ? error.constructor.name : 'Error',
      reason: error instanceof Error ? error.message : String(error),
      kind,
    };
  }
}

async function main(): Promise<void> {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) {
    throw new Error('Usage: ai-admission-probe.ts <in.json> <out.json>');
  }
  const items = JSON.parse(readFileSync(input, 'utf8')) as (
    | ProbeCase
    | ProbeWritingCase
  )[];
  const results: Record<string, unknown> = {};
  for (const item of items)
    results[item.id] = 'kind' in item ? probeWriting(item) : await probe(item);
  writeFileSync(output, JSON.stringify(results, null, 1), 'utf8');
}

if (require.main === module) void main();
