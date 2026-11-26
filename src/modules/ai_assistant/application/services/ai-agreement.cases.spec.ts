import { readFileSync } from 'fs';
import { join } from 'path';

import {
  probe,
  probeTitles,
  probeWriting,
} from '../../../../../scripts/ai-admission-probe';

interface ProbePage {
  id: string;
  title: string;
}

interface ProbeAnswer {
  stage?: string;
  relaxedOnly?: boolean;
}

interface AgreementCase {
  id: string;
  kind: 'modify' | 'writing';
  text: string;
  selectedText?: string | null;
  pages?: string;
  currentPageId?: string | null;
  pageTitle?: string;
  refuse?: boolean;
  known: boolean;
  fastapi: {
    intent: string;
    pageIntent?: Record<string, unknown> | null;
    plan?: { status: string; operations: { type: string }[] } | null;
    result?: Record<string, unknown> | null;
    draftLanguage?: string | null;
  };
  nestjs: {
    titles?: string[];
    admission?: ProbeAnswer | null;
    withPlan?: ProbeAnswer | null;
    source?: boolean;
    draftSource?: boolean;
  };
}

const data = JSON.parse(
  readFileSync(join(__dirname, 'ai-agreement.cases.json'), 'utf8'),
) as {
  knownBaseline: number;
  pageSets: Record<string, ProbePage[]>;
  cases: AgreementCase[];
};

const DECIDED_WRITING = [
  'IMPROVE',
  'SHORTEN',
  'EXPAND',
  'SUMMARIZE',
  'TRANSLATE',
  'CONTINUE',
];

function compared(item: AgreementCase): boolean {
  if (item.kind === 'writing') return true;
  const pageIntent = item.fastapi.pageIntent;
  return (
    ['MODIFY_PAGE', 'MODEL'].includes(item.fastapi.intent) &&
    !!pageIntent &&
    pageIntent.intent === 'MODIFY_PAGE'
  );
}

function disagreements(
  item: AgreementCase,
  nestjs: AgreementCase['nestjs'],
): string[] {
  if (!compared(item)) return [];
  const found: string[] = [];
  if (item.kind === 'writing') {
    if (item.fastapi.intent === 'WRITING' && !nestjs.source) found.push('L3');
    const action = item.fastapi.result?.writingAction as string | undefined;
    const decidedOther =
      item.fastapi.intent === 'WRITING' &&
      !!action &&
      DECIDED_WRITING.includes(action);
    if (
      !item.selectedText &&
      nestjs.draftSource &&
      action !== 'DRAFT' &&
      !decidedOther
    )
      found.push('L4');
    return found;
  }
  const plan = item.fastapi.plan;
  const draft = !!plan && plan.status === 'PLAN_READY';
  if (item.refuse) return draft ? ['L5'] : [];
  if (draft && nestjs.withPlan?.stage !== 'admitted') found.push('L1');
  if (
    nestjs.admission?.stage === 'admitted' &&
    nestjs.admission.relaxedOnly &&
    !plan
  )
    found.push('L2');
  return found;
}

async function nestjsNow(
  item: AgreementCase,
): Promise<AgreementCase['nestjs']> {
  if (item.kind === 'writing') {
    const source =
      item.fastapi.intent === 'WRITING' && item.fastapi.result
        ? probeWriting({
            id: item.id,
            kind: 'writing',
            instruction: item.text,
            selectedText: item.selectedText ?? null,
            intent: item.fastapi.result,
          }).source !== null
        : false;
    const draftSource = item.selectedText
      ? false
      : probeWriting({
          id: item.id,
          kind: 'writing',
          instruction: item.text,
          selectedText: null,
          intent: {
            intent: 'WRITING',
            writingAction: 'DRAFT',
            language: item.fastapi.draftLanguage ?? null,
            needsClarification: false,
          },
        }).source !== null;
    return { source, draftSource };
  }
  const pages = data.pageSets[item.pages as string];
  const titles = probeTitles({
    id: item.id,
    kind: 'titles',
    instruction: item.text,
    pages,
  }).titles;
  const pageIntent = item.fastapi.pageIntent;
  if (!pageIntent) return { titles, admission: null, withPlan: null };
  const base = {
    id: item.id,
    instruction: item.text,
    pageTitle: item.pageTitle as string,
    pages,
    ...(item.currentPageId ? { currentPageId: item.currentPageId } : {}),
    pageIntent,
  };
  const admission = await probe(base);
  const withPlan = item.fastapi.plan
    ? await probe({ ...base, plan: item.fastapi.plan, planProvider: 'rules' })
    : null;
  return { titles, admission, withPlan };
}

describe('two-side agreement cases shared with the AI service (A7-DT)', () => {
  it.each(data.cases.map((item) => [item.id, item]))(
    'NestJS rules give what both sides agreed on: %s',
    async (_id, item) => {
      const nestjs = await nestjsNow(item);
      expect(JSON.parse(JSON.stringify(nestjs))).toEqual(item.nestjs);
      if (!item.known) expect(disagreements(item, nestjs)).toEqual([]);
    },
  );

  it('does not let known disagreements grow', () => {
    expect(data.cases.filter((item) => item.known).length).toBeLessThanOrEqual(
      data.knownBaseline,
    );
  });
});
