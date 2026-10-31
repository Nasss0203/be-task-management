import type { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';

import { FastApiAiRuntimeAdapter } from '../../infrastructure/runtime/fast-api-ai-runtime.adapter';
import {
  DESCRIBED_PAGE_MAX_GAP,
  DESCRIBED_PAGE_MIN_SCORE,
  describedPageMatches,
} from '../embedding/described-page-candidates';
import type {
  PageEmbeddingMatch,
  PageEmbeddingSearch,
} from '../embedding/page-embedding-search.service';
import { isSupportedDescriptionModification } from '../services/ai-modification-operation.policy';
import type { AiModificationPlannerService } from '../services/ai-modification-planner.service';
import { AiPageInstructionPlannerService } from '../services/ai-page-instruction-planner.service';
import type { PageIntentExtractionService } from './page-intent-extraction.service';
import type { PageReferenceResolver } from './page-reference-resolver.service';
import type { PageResolutionCandidate } from './page-resolution.types';

jest.mock('@nestjs/axios', () => ({ HttpService: jest.fn() }));

// M6 (kế hoạch tìm theo mô tả): a Page named by what it is for.
const page = (pageId: string, title: string): PageResolutionCandidate => ({
  pageId,
  workspaceId: 'workspace-1',
  title,
  parentPageId: null,
  teamspaceId: null,
});
const meetings = page('meetings', 'Hội họp tuần');
const release = page('release', 'Release 2.0');
const match = (candidate: PageResolutionCandidate, score: number) => ({
  pageId: candidate.pageId,
  page: candidate,
  score,
  blockId: null,
  excerpt: null,
});
const describedIntent = {
  intent: 'MODIFY_PAGE' as const,
  referenceType: 'DESCRIPTION' as const,
  pageReference: null,
  instruction: 'Thêm mục họp',
  needsClarification: false as const,
  description: 'biên bản họp hằng tuần',
};
const sentence = 'Thêm mục họp vào trang ghi biên bản họp hằng tuần';

describe('page intent adapter: DESCRIPTION (G1)', () => {
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

  it('accepts a description taken from the sentence', async () => {
    await expect(
      setup(describedIntent).extract(sentence),
    ).resolves.toMatchObject({
      result: describedIntent,
    });
  });

  it.each([
    ['words not in the sentence', { description: 'kế hoạch marketing' }],
    ['an empty description', { description: ' ' }],
    ['a title as well', { pageReference: 'Hội họp tuần' }],
    ['a clarification', { needsClarification: true }],
    ['an extra key', { scope: { parentTitle: 'A', teamspaceName: null } }],
  ])('rejects %s', async (_name, change) => {
    await expect(
      setup({ ...describedIntent, ...change }).extract(sentence),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('rejects a description on another kind of result', async () => {
    const result = {
      intent: 'MODIFY_PAGE',
      referenceType: 'TITLE',
      pageReference: 'Hội họp tuần',
      instruction: 'Thêm mục họp',
      needsClarification: false,
      description: 'biên bản họp hằng tuần',
    };
    await expect(
      setup(result).extract(
        'Thêm mục họp vào trang Hội họp tuần biên bản họp hằng tuần',
      ),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});

describe('isSupportedDescriptionModification (G5)', () => {
  it.each([
    [sentence, 'Thêm mục họp', 'biên bản họp hằng tuần'],
    [
      'Sửa trang dùng để chuẩn bị phát hành sản phẩm: thêm checklist gồm a, b',
      'thêm checklist gồm a, b',
      'chuẩn bị phát hành sản phẩm',
    ],
    // "xoá" in the description names the Page; it is no edit here.
    [
      'thêm checklist gồm a, b vào trang về kế hoạch xoá nợ nhé',
      'thêm checklist gồm a, b',
      'kế hoạch xoá nợ',
    ],
    [
      'add a checklist to the page about onboarding new staff',
      'add a checklist',
      'onboarding new staff',
    ],
  ])('admits %s', (source, instruction, description) => {
    expect(
      isSupportedDescriptionModification(source, instruction, description),
    ).toBe(true);
  });

  it.each([
    // The edit itself is not supported.
    [
      'xoá trang vào trang về kế hoạch marketing',
      'xoá trang',
      'kế hoạch marketing',
    ],
    // Words beyond the description.
    [`${sentence} rồi xoá trang`, 'Thêm mục họp', 'biên bản họp hằng tuần'],
    // A second Page inside the description.
    ['thêm mục vào trang về trang Q4 khác', 'thêm mục', 'trang Q4 khác'],
  ])('refuses %s', (source, instruction, description) => {
    expect(
      isSupportedDescriptionModification(source, instruction, description),
    ).toBe(false);
  });
});

describe('describedPageMatches (G3)', () => {
  it('keeps at most three Pages close to the best one', () => {
    const scores = [0.72, 0.7, 0.62, 0.6, 0.4];
    const matches = scores.map((score, index) =>
      match(page(`p${index}`, `P${index}`), score),
    );
    expect(describedPageMatches(matches).map((m) => m.score)).toEqual([
      0.72, 0.7, 0.62,
    ]);
  });

  it('drops Pages too far below the best one', () => {
    const matches = [
      match(meetings, 0.7),
      match(release, 0.7 - DESCRIBED_PAGE_MAX_GAP - 0.01),
    ];
    expect(describedPageMatches(matches)).toEqual([matches[0]]);
  });

  it('offers nothing when even the best Page is not close', () => {
    expect(
      describedPageMatches([match(meetings, DESCRIBED_PAGE_MIN_SCORE - 0.01)]),
    ).toEqual([]);
  });
});

describe('AiPageInstructionPlannerService: a described Page (G3, G4, G5)', () => {
  const extract = jest.fn();
  const resolve = jest.fn();
  const resolveFromSentence = jest.fn();
  const resolveSimilarTitles = jest.fn();
  const search = jest.fn();
  const plan = jest.fn();
  const resolver = {
    resolve,
    resolveFromSentence,
    resolveSimilarTitles,
  } as unknown as PageReferenceResolver;
  const service = new AiPageInstructionPlannerService(
    { extract } as unknown as PageIntentExtractionService,
    resolver,
    { generate: plan } as unknown as AiModificationPlannerService,
    { search } as unknown as PageEmbeddingSearch,
  );
  const input = {
    userId: 'actor-1',
    workspaceId: 'workspace-1',
    requestId: 'request-1',
    instruction: sentence,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    extract.mockResolvedValue({ result: describedIntent });
    resolveFromSentence.mockResolvedValue({
      status: 'NOT_FOUND',
      candidates: [],
    });
    search.mockResolvedValue([
      match(meetings, 0.67),
      match(release, 0.39),
    ] satisfies PageEmbeddingMatch[]);
    plan.mockResolvedValue({ pageId: 'meetings', status: 'PLAN_READY' });
  });

  it('offers the close Pages for a choice, even a single one, and drafts nothing', async () => {
    expect(await service.generate(input)).toEqual({
      status: 'AMBIGUOUS_PAGE',
      intent: describedIntent,
      candidates: [meetings],
      resolutionMethod: 'SEMANTIC',
    });
    expect(search).toHaveBeenCalledWith({
      userId: 'actor-1',
      workspaceId: 'workspace-1',
      query: 'biên bản họp hằng tuần',
      limit: 5,
      shareToken: undefined,
    });
    expect(plan).not.toHaveBeenCalled();
  });

  it('drafts on the Page the user picked among those offered', async () => {
    expect(
      await service.generate({ ...input, selectedPageId: 'meetings' }),
    ).toMatchObject({
      status: 'PLAN_GENERATED',
      resolutionMethod: 'SEMANTIC',
      page: meetings,
    });
    expect(
      await service.generate({ ...input, selectedPageId: 'release' }),
    ).toEqual({ status: 'PAGE_NOT_FOUND', intent: describedIntent });
  });

  it('goes by a real title the sentence ends with (G4)', async () => {
    // A real title that starts with the cue word ("ghi …").
    const recipes = page('recipes', 'ghi biên bản họp hằng tuần');
    plan.mockResolvedValue({ pageId: 'recipes', status: 'PLAN_READY' });
    resolveFromSentence.mockResolvedValue({
      status: 'CANDIDATES',
      candidates: [recipes],
      resolutionMethod: 'TITLE_IN_SENTENCE',
    });
    expect(await service.generate(input)).toMatchObject({
      status: 'PLAN_GENERATED',
      resolutionMethod: 'EXACT_TITLE',
      intent: {
        referenceType: 'TITLE',
        pageReference: 'ghi biên bản họp hằng tuần',
      },
    });
    expect(search).not.toHaveBeenCalled();
  });

  it.each([
    [
      'no Page is close',
      () => search.mockResolvedValue([match(release, 0.39)]),
    ],
    [
      'the AI service is down',
      () => search.mockRejectedValue(new ServiceUnavailableException()),
    ],
    ['there are no vectors', () => search.mockResolvedValue([])],
  ])('ends as before when %s (G5)', async (_name, arrange) => {
    arrange();
    expect(await service.generate(input)).toEqual({
      status: 'PAGE_NOT_FOUND',
      intent: describedIntent,
    });
  });

  it('refuses an unsupported edit before looking for the Page', async () => {
    extract.mockResolvedValue({
      result: { ...describedIntent, instruction: 'xoá trang' },
    });
    expect(
      await service.generate({
        ...input,
        instruction: 'xoá trang vào trang ghi biên bản họp hằng tuần',
      }),
    ).toMatchObject({ status: 'UNSUPPORTED_OPERATION' });
    expect(search).not.toHaveBeenCalled();
  });

  it('tries the description for a title nothing else found (G4)', async () => {
    const titled = {
      intent: 'MODIFY_PAGE' as const,
      referenceType: 'TITLE' as const,
      pageReference: 'ghi biên bản họp hằng tuần',
      instruction: 'Thêm mục họp',
      needsClarification: false,
    };
    extract.mockResolvedValue({ result: titled });
    resolve.mockResolvedValue({ status: 'NOT_FOUND', candidates: [] });
    resolveSimilarTitles.mockResolvedValue({
      status: 'NOT_FOUND',
      candidates: [],
    });
    expect(await service.generate(input)).toEqual({
      status: 'AMBIGUOUS_PAGE',
      intent: titled,
      candidates: [meetings],
      resolutionMethod: 'SEMANTIC',
    });
    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'ghi biên bản họp hằng tuần' }),
    );
  });

  it('never searches the whole sentence of an unresolved Page (G4)', async () => {
    extract.mockResolvedValue({
      result: {
        intent: 'MODIFY_PAGE',
        referenceType: 'UNRESOLVED',
        pageReference: null,
        instruction: 'Thêm mục họp',
        needsClarification: true,
      },
    });
    await service.generate(input);
    expect(search).not.toHaveBeenCalled();
  });

  it('looks for nothing without the search (vectors not wired)', async () => {
    const without = new AiPageInstructionPlannerService(
      { extract } as unknown as PageIntentExtractionService,
      resolver,
      { generate: plan } as unknown as AiModificationPlannerService,
    );
    expect(await without.generate(input)).toEqual({
      status: 'PAGE_NOT_FOUND',
      intent: describedIntent,
    });
  });
});
