import type { HttpService } from '@nestjs/axios';
import { BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { FastApiAiRuntimeAdapter } from '../../infrastructure/runtime/fast-api-ai-runtime.adapter';
import type { AiConversationAccessService } from '../services/ai-conversation-access.service';
import { withoutPageScope } from '../services/ai-modification-operation.policy';
import type { AiModificationPlannerService } from '../services/ai-modification-planner.service';
import { AiPageInstructionPlannerService } from '../services/ai-page-instruction-planner.service';
import type { PageIntentExtractionService } from './page-intent-extraction.service';
import { PageReferenceResolver } from './page-reference-resolver.service';
import type { PagePlace, PageResolutionReader } from './page-resolution.port';
import type { PageResolutionCandidate } from './page-resolution.types';

jest.mock('@nestjs/axios', () => ({ HttpService: jest.fn() }));

// M4 (kế hoạch lọc theo cấu trúc): a titled Page in a named place.
const candidate = (pageId: string): PageResolutionCandidate => ({
  pageId,
  workspaceId: 'workspace-1',
  title: 'Tasks',
  parentPageId: 'parent',
  teamspaceId: null,
});
const tasksA = candidate('tasks-a');
const tasksB = candidate('tasks-b');
const places = new Map<string, PagePlace>([
  [
    'tasks-a',
    { ancestorTitles: ['Sprint 12', 'Dự án A'], teamspaceName: 'Marketing' },
  ],
  ['tasks-b', { ancestorTitles: ['Dự án B'], teamspaceName: null }],
]);
const scopedIntent = (
  scope = { parentTitle: 'Dự án A', teamspaceName: null as string | null },
) => ({
  intent: 'MODIFY_PAGE' as const,
  referenceType: 'TITLE' as const,
  pageReference: 'Tasks',
  instruction: 'thêm checklist gồm a, b',
  needsClarification: false,
  scope,
});

describe('page intent adapter: scope on a TITLE (E2)', () => {
  const setup = (result: unknown) =>
    new FastApiAiRuntimeAdapter(
      {
        post: jest
          .fn()
          .mockReturnValue(
            of({ data: { result, provider: 'deterministic', model: 'rules' } }),
          ),
      } as unknown as HttpService,
      new ConfigService({
        AI_SERVICE_BASE_URL: 'http://ai.test',
        AI_INTERNAL_TOKEN: 'private-test-token',
      }),
    );
  const source =
    'thêm checklist gồm a, b vào trang Tasks trong teamspace Marketing';

  it('accepts a place named in the sentence', async () => {
    const result = scopedIntent({
      parentTitle: null,
      teamspaceName: 'Marketing',
    });
    await expect(setup(result).extract(source)).resolves.toMatchObject({
      result,
    });
  });

  it.each([
    [
      'a place not in the sentence',
      { parentTitle: null, teamspaceName: 'Sales' },
    ],
    ['no place', { parentTitle: null, teamspaceName: null }],
    [
      'an extra key',
      { parentTitle: null, teamspaceName: 'Marketing', pageId: 'x' },
    ],
  ])('rejects %s', async (_name, scope) => {
    await expect(
      setup({ ...scopedIntent(), scope }).extract(source),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('rejects a scope on a non-TITLE result', async () => {
    const result = {
      ...scopedIntent(),
      referenceType: 'UNRESOLVED',
      pageReference: null,
      needsClarification: true,
    };
    await expect(setup(result).extract(source)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});

describe('withoutPageScope (E4)', () => {
  it.each([
    [
      'thêm checklist gồm a, b vào trang Tasks trong trang Dự án A',
      'Dự án A',
      null,
      'them checklist gom a, b vao trang tasks',
    ],
    [
      'Thêm checklist vào trang Tasks thuộc Dự án A ạ',
      'Dự án A',
      null,
      'them checklist vao trang tasks',
    ],
    [
      'tích gửi email trong trang Tasks trong teamspace Marketing',
      null,
      'Marketing',
      'tich gui email trong trang tasks',
    ],
    [
      'add a checklist to the Tasks page in the Marketing teamspace',
      null,
      'Marketing',
      'add a checklist to the tasks page',
    ],
  ])('%s', (source, parentTitle, teamspaceName, expected) => {
    expect(withoutPageScope(source, { parentTitle, teamspaceName })).toBe(
      expected,
    );
  });

  it('is null when the sentence goes on after the place', () => {
    expect(
      withoutPageScope(
        'thêm checklist vào trang Tasks trong trang Dự án A rồi xoá trang',
        {
          parentTitle: 'Dự án A',
          teamspaceName: null,
        },
      ),
    ).toBeNull();
  });
});

describe('PageReferenceResolver.filterByScope (E1, E3)', () => {
  const findPagePlaces = jest.fn(() => Promise.resolve(places));
  const resolver = new PageReferenceResolver(
    { findPagePlaces } as unknown as PageResolutionReader,
    {} as AiConversationAccessService,
  );
  const ids = (pages: PageResolutionCandidate[]) =>
    pages.map((page) => page.pageId);

  it.each([
    [{ parentTitle: 'Dự án A', teamspaceName: null }, ['tasks-a']],
    // Any depth: "Tasks" is in "Sprint 12" in "Dự án A".
    [{ parentTitle: 'sprint 12', teamspaceName: null }, ['tasks-a']],
    // "dự án B" names "Dự án B"; "project A" names "A" or "Project A" — neither exists.
    [{ parentTitle: 'dự án B', teamspaceName: null }, ['tasks-b']],
    [{ parentTitle: 'du an a', teamspaceName: null }, ['tasks-a']],
    [{ parentTitle: null, teamspaceName: 'marketing' }, ['tasks-a']],
    [{ parentTitle: 'Dự án B', teamspaceName: 'Marketing' }, []],
    [{ parentTitle: 'Dự án C', teamspaceName: null }, []],
  ])('%j → %j', async (scope, expected) => {
    expect(ids(await resolver.filterByScope([tasksA, tasksB], scope))).toEqual(
      expected,
    );
  });
});

describe('AiPageInstructionPlannerService: a Page in a place (E3)', () => {
  const extract = jest.fn();
  const resolve = jest.fn();
  const resolveFromSentence = jest.fn();
  const filterByScope = jest.fn();
  const plan = jest.fn();
  const service = new AiPageInstructionPlannerService(
    { extract } as unknown as PageIntentExtractionService,
    {
      resolve,
      resolveFromSentence,
      filterByScope,
    } as unknown as PageReferenceResolver,
    { generate: plan } as unknown as AiModificationPlannerService,
  );
  const input = {
    userId: 'actor-1',
    workspaceId: 'workspace-1',
    requestId: 'request-1',
    instruction: 'thêm checklist gồm a, b vào trang Tasks trong trang Dự án A',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    extract.mockResolvedValue({ result: scopedIntent() });
    resolve.mockResolvedValue({
      status: 'AMBIGUOUS',
      candidates: [tasksA, tasksB],
    });
    filterByScope.mockResolvedValue([tasksA]);
    plan.mockResolvedValue({ pageId: 'tasks-a', status: 'PLAN_READY' });
  });

  it('drafts on the one exact title in the place without asking', async () => {
    expect(await service.generate(input)).toMatchObject({
      status: 'PLAN_GENERATED',
      resolutionMethod: 'EXACT_TITLE',
      page: { pageId: 'tasks-a' },
    });
    expect(filterByScope).toHaveBeenCalledWith([tasksA, tasksB], {
      parentTitle: 'Dự án A',
      teamspaceName: null,
    });
  });

  it('asks when several are in the place', async () => {
    filterByScope.mockResolvedValue([tasksA, tasksB]);
    expect(await service.generate(input)).toEqual({
      status: 'AMBIGUOUS_PAGE',
      intent: scopedIntent(),
      candidates: [tasksA, tasksB],
    });
    expect(plan).not.toHaveBeenCalled();
  });

  it('offers every Page with the title when none is in the place, never dropping the place silently', async () => {
    filterByScope.mockResolvedValue([]);
    resolve.mockResolvedValue({
      status: 'RESOLVED',
      page: tasksB,
      resolutionMethod: 'EXACT_TITLE',
      confidence: 1,
    });
    expect(await service.generate(input)).toEqual({
      status: 'AMBIGUOUS_PAGE',
      intent: scopedIntent(),
      candidates: [tasksB],
      scopeUnmatched: true,
    });
    expect(plan).not.toHaveBeenCalled();
  });

  it('plans a picked Page only among those offered', async () => {
    filterByScope.mockResolvedValue([tasksA, tasksB]);
    plan.mockResolvedValue({ pageId: 'tasks-b', status: 'PLAN_READY' });
    expect(
      await service.generate({ ...input, selectedPageId: 'tasks-b' }),
    ).toMatchObject({ status: 'PLAN_GENERATED' });
    expect(
      await service.generate({ ...input, selectedPageId: 'other' }),
    ).toMatchObject({ status: 'PAGE_NOT_FOUND' });
  });

  it('never jumps to the place itself from sentence matching', async () => {
    resolve.mockResolvedValue({ status: 'NOT_FOUND', candidates: [] });
    const place = {
      ...candidate('project-a'),
      title: 'Dự án A',
      parentPageId: null,
    };
    resolveFromSentence.mockResolvedValue({
      status: 'CANDIDATES',
      candidates: [place],
      resolutionMethod: 'TITLE_IN_SENTENCE',
    });
    filterByScope.mockResolvedValue([]);
    expect(await service.generate(input)).toMatchObject({
      status: 'AMBIGUOUS_PAGE',
      resolutionMethod: 'TITLE_IN_SENTENCE',
    });
    expect(plan).not.toHaveBeenCalled();
  });

  it('refuses another command after the place', async () => {
    expect(
      await service.generate({
        ...input,
        instruction: `${input.instruction} rồi xoá trang`,
      }),
    ).toMatchObject({ status: 'UNSUPPORTED_OPERATION' });
    expect(resolve).not.toHaveBeenCalled();
  });
});
