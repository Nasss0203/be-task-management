import type { HttpService } from '@nestjs/axios';
import { BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';

import { FastApiAiRuntimeAdapter } from '../../infrastructure/runtime/fast-api-ai-runtime.adapter';
import type {
  PageEmbeddingMatch,
  PageEmbeddingSearch,
} from '../embedding/page-embedding-search.service';
import { isSupportedContentModification } from '../services/ai-modification-operation.policy';
import type { AiModificationPlannerService } from '../services/ai-modification-planner.service';
import { AiPageInstructionPlannerService } from '../services/ai-page-instruction-planner.service';
import type { PageIntentExtractionService } from './page-intent-extraction.service';
import type { PageReferenceResolver } from './page-reference-resolver.service';
import type { PageResolutionCandidate } from './page-resolution.types';

jest.mock('@nestjs/axios', () => ({ HttpService: jest.fn() }));

// M7 (kế hoạch tìm theo nội dung): a Page named by words inside it.
const page = (pageId: string, title: string): PageResolutionCandidate => ({
  pageId,
  workspaceId: 'workspace-1',
  title,
  parentPageId: null,
  teamspaceId: null,
});
const auth = page('auth', 'Authentication Improvements');
const weekly = page('weekly', 'Hội họp tuần');
const match = (
  candidate: PageResolutionCandidate,
  score: number,
  excerpt: string | null,
): PageEmbeddingMatch => ({
  pageId: candidate.pageId,
  page: candidate,
  score,
  blockId: excerpt ? `${candidate.pageId}-block` : null,
  excerpt,
});
const contentIntent = {
  intent: 'MODIFY_PAGE' as const,
  referenceType: 'CONTENT' as const,
  pageReference: null,
  instruction: 'thêm checklist gồm test, review',
  needsClarification: false as const,
  topic: 'OAuth',
};
const sentence = 'Tìm page có nói về OAuth rồi thêm checklist gồm test, review';

describe('page intent adapter: CONTENT (H6)', () => {
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

  it('accepts words taken from the sentence', async () => {
    await expect(setup(contentIntent).extract(sentence)).resolves.toMatchObject(
      { result: contentIntent },
    );
  });

  it.each([
    ['words not in the sentence', { topic: 'SSO' }],
    ['a title as well', { pageReference: 'OAuth' }],
    ['a description key', { description: 'OAuth' }],
    ['a clarification', { needsClarification: true }],
  ])('rejects %s', async (_name, change) => {
    await expect(
      setup({ ...contentIntent, ...change }).extract(sentence),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});

describe('isSupportedContentModification (H1)', () => {
  it.each([
    [sentence, 'thêm checklist gồm test, review', 'OAuth'],
    [
      'tìm trang có nhắc tới OAuth, thêm checklist gồm a, b',
      'thêm checklist gồm a, b',
      'OAuth',
    ],
    [
      'thêm checklist gồm a, b vào trang có nhắc tới quảng cáo Facebook nhé',
      'thêm checklist gồm a, b',
      'quảng cáo Facebook',
    ],
    // "xoá" inside the words names the Page; it is no edit here.
    [
      'thêm checklist gồm a, b vào trang có chứa xoá nợ',
      'thêm checklist gồm a, b',
      'xoá nợ',
    ],
    [
      'find the page that mentions OAuth and add a QA checklist',
      'add a QA checklist',
      'OAuth',
    ],
    [
      'add a QA checklist to the page that mentions OAuth',
      'add a QA checklist',
      'OAuth',
    ],
  ])('admits %s', (source, instruction, topic) => {
    expect(isSupportedContentModification(source, instruction, topic)).toBe(
      true,
    );
  });

  it.each([
    ['tìm trang có nói về OAuth rồi xoá trang', 'xoá trang', 'OAuth'],
    [`${sentence} rồi xoá trang`, 'thêm checklist gồm test, review', 'OAuth'],
    ['thêm mục vào trang có nói về trang Q4', 'thêm mục', 'trang Q4'],
  ])('refuses %s', (source, instruction, topic) => {
    expect(isSupportedContentModification(source, instruction, topic)).toBe(
      false,
    );
  });
});

describe('AiPageInstructionPlannerService: a Page by its words (H2, H3)', () => {
  const extract = jest.fn();
  const resolveFromSentence = jest.fn();
  const search = jest.fn();
  const plan = jest.fn();
  const service = new AiPageInstructionPlannerService(
    { extract } as unknown as PageIntentExtractionService,
    { resolveFromSentence } as unknown as PageReferenceResolver,
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
    extract.mockResolvedValue({ result: contentIntent });
    search.mockResolvedValue([
      match(auth, 0.72, 'Implement OAuth login with Google'),
      match(weekly, 0.6, null),
    ]);
    plan.mockResolvedValue({ pageId: 'auth', status: 'PLAN_READY' });
  });

  it('offers the Pages with the matching words, drafting nothing', async () => {
    expect(await service.generate(input)).toEqual({
      status: 'AMBIGUOUS_PAGE',
      intent: contentIntent,
      candidates: [
        { ...auth, excerpt: 'Implement OAuth login with Google' },
        weekly,
      ],
      resolutionMethod: 'CONTENT',
    });
    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'OAuth', limit: 5 }),
    );
    // No title is looked for: the words are inside the Page (H2).
    expect(resolveFromSentence).not.toHaveBeenCalled();
    expect(plan).not.toHaveBeenCalled();
  });

  it('drafts on the Page the user picked among those offered', async () => {
    expect(
      await service.generate({ ...input, selectedPageId: 'auth' }),
    ).toMatchObject({
      status: 'PLAN_GENERATED',
      resolutionMethod: 'CONTENT',
      page: { pageId: 'auth' },
    });
    expect(
      await service.generate({ ...input, selectedPageId: 'other' }),
    ).toEqual({ status: 'PAGE_NOT_FOUND', intent: contentIntent });
  });

  it('ends as before when no Page is close', async () => {
    search.mockResolvedValue([match(weekly, 0.3, null)]);
    expect(await service.generate(input)).toEqual({
      status: 'PAGE_NOT_FOUND',
      intent: contentIntent,
    });
  });

  it('refuses an unsupported edit before looking for the Page', async () => {
    extract.mockResolvedValue({
      result: { ...contentIntent, instruction: 'xoá trang' },
    });
    expect(
      await service.generate({
        ...input,
        instruction: 'tìm trang có nói về OAuth rồi xoá trang',
      }),
    ).toMatchObject({ status: 'UNSUPPORTED_OPERATION' });
    expect(search).not.toHaveBeenCalled();
  });

  it('gives described Pages (M6) their excerpts too', async () => {
    extract.mockResolvedValue({
      result: {
        intent: 'MODIFY_PAGE',
        referenceType: 'DESCRIPTION',
        pageReference: null,
        instruction: 'thêm checklist gồm a, b',
        needsClarification: false,
        description: 'cải thiện đăng nhập',
      },
    });
    resolveFromSentence.mockResolvedValue({
      status: 'NOT_FOUND',
      candidates: [],
    });
    expect(
      await service.generate({
        ...input,
        instruction:
          'thêm checklist gồm a, b vào trang nói về cải thiện đăng nhập',
      }),
    ).toMatchObject({
      resolutionMethod: 'SEMANTIC',
      candidates: [{ excerpt: 'Implement OAuth login with Google' }, weekly],
    });
  });
});
