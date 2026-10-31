import type { HttpService } from '@nestjs/axios';
import { BadGatewayException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';

import { FastApiAiRuntimeAdapter } from '../../infrastructure/runtime/fast-api-ai-runtime.adapter';
import type { PageIntentExtractionService } from '../resolution/page-intent-extraction.service';
import type { PageReferenceResolver } from '../resolution/page-reference-resolver.service';
import type { PageResolutionCandidate } from '../resolution/page-resolution.types';
import type { AiConversationAccessService } from '../services/ai-conversation-access.service';
import { withoutBasedOn } from '../services/ai-modification-operation.policy';
import type { AiModificationPlannerService } from '../services/ai-modification-planner.service';
import { AiPageInstructionPlannerService } from '../services/ai-page-instruction-planner.service';
import type { PageEmbeddingStore, TextEmbedder } from './page-embedding.port';
import { PageEmbeddingSearch } from './page-embedding-search.service';
import {
  namedSourcePage,
  PageSourceReferences,
} from './page-source-references.service';

jest.mock('@nestjs/axios', () => ({ HttpService: jest.fn() }));

// M8 (kế hoạch ngữ cảnh RAG): what the draft is based on.
const page = (pageId: string, title: string): PageResolutionCandidate => ({
  pageId,
  workspaceId: 'workspace-1',
  title,
  parentPageId: null,
  teamspaceId: null,
});
const release = page('release', 'Release 2.0');
const bugs = page('bugs', 'Bug tracker');
const sentence =
  'thêm checklist các bug blocker vào trang Release 2.0 dựa trên trang Bug tracker';
const titledIntent = {
  intent: 'MODIFY_PAGE' as const,
  referenceType: 'TITLE' as const,
  pageReference: 'Release 2.0',
  instruction: 'thêm checklist các bug blocker',
  needsClarification: false,
  basedOn: 'trang Bug tracker',
};
const block = (id: string, type: string, text: string) => ({
  id,
  type,
  title: null,
  content: { text },
});

const adapter = (
  data: unknown,
  post = jest.fn().mockReturnValue(of({ data })),
) =>
  new FastApiAiRuntimeAdapter(
    { post } as unknown as HttpService,
    new ConfigService({
      AI_SERVICE_BASE_URL: 'http://ai.test',
      AI_INTERNAL_TOKEN: 'private-test-token',
    }),
  );

describe('page intent adapter: basedOn (I2)', () => {
  const wrap = (result: unknown) => ({
    result,
    provider: 'deterministic',
    model: 'rules',
  });

  it('accepts a source taken from the sentence on any edit', async () => {
    await expect(
      adapter(wrap(titledIntent)).extract(sentence),
    ).resolves.toMatchObject({ result: titledIntent });
  });

  it.each([
    ['a source not in the sentence', { ...titledIntent, basedOn: 'trang QA' }],
    ['an empty source', { ...titledIntent, basedOn: ' ' }],
    [
      'a source on a request that edits nothing',
      {
        intent: 'OTHER',
        referenceType: 'UNRESOLVED',
        pageReference: null,
        instruction: null,
        needsClarification: false,
        basedOn: 'trang Bug tracker',
      },
    ],
  ])('rejects %s', async (_name, result) => {
    await expect(
      adapter(wrap(result)).extract(sentence),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('sends references to the planner only when there are some', async () => {
    const post = jest
      .fn()
      .mockReturnValue(
        of({ data: { result: {}, provider: 'ollama', model: 'qwen' } }),
      );
    const runtime = adapter(null, post);
    const request = {
      requestId: 'r',
      capability: 'GENERATE_PAGE_MODIFICATION_PLAN',
      content: 'thêm checklist',
      context: { page: {} },
    };
    await runtime.execute({ ...request, input: {} });
    await runtime.execute({
      ...request,
      input: {
        references: [{ label: 'S1', pageTitle: 'Bug tracker', text: 'x' }],
      },
    });
    const [first, second] = post.mock.calls as [string, unknown][];
    expect(first[1]).not.toHaveProperty('references');
    expect(second[1]).toMatchObject({
      references: [{ label: 'S1', pageTitle: 'Bug tracker', text: 'x' }],
    });
  });
});

describe('withoutBasedOn / namedSourcePage (I3, I6)', () => {
  it.each([
    [
      sentence,
      'trang Bug tracker',
      'thêm checklist các bug blocker vào trang Release 2.0',
    ],
    [
      'thêm mục rủi ro vào trang Release 2.0, dựa trên ghi chú QA gần đây nhé',
      'ghi chú QA gần đây',
      'thêm mục rủi ro vào trang Release 2.0',
    ],
    [
      'add a summary to the Release 2.0 page based on the QA notes',
      'the QA notes',
      'add a summary to the Release 2.0 page',
    ],
    // The source must close the sentence.
    [`${sentence} rồi xoá trang`, 'trang Bug tracker', null],
  ])('%s', (source, basedOn, expected) => {
    expect(withoutBasedOn(source, basedOn)).toBe(expected);
  });

  it.each([
    ['trang Bug tracker', 'Bug tracker'],
    ['"Bug tracker"', 'Bug tracker'],
    ['the Bug tracker page', 'Bug tracker'],
    ['ghi chú QA gần đây', null],
    ['the QA notes', null],
  ])('%s names %s', (basedOn, title) => {
    expect(namedSourcePage(basedOn)).toBe(title);
  });
});

describe('PageSourceReferences (I3, I4, I7)', () => {
  const resolve = jest.fn();
  const loadSource = jest.fn();
  const searchPassages = jest.fn();
  const references = new PageSourceReferences(
    { resolve } as unknown as PageReferenceResolver,
    { loadSource } as unknown as PageEmbeddingStore,
    { searchPassages } as unknown as PageEmbeddingSearch,
  );
  const input = {
    userId: 'user-1',
    workspaceId: 'workspace-1',
    basedOn: 'trang Bug tracker',
    targetPageId: 'release',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    resolve.mockResolvedValue({ status: 'RESOLVED', page: bugs });
    loadSource.mockResolvedValue({
      pageId: 'bugs',
      workspaceId: 'workspace-1',
      title: 'Bug tracker',
      readAt: 'now',
      blocks: [
        block('h', 'HEADER', 'Blocker'),
        block('b1', 'TODO', 'Ứng dụng bị crash khi tải ảnh lớn'),
        block('view', 'DATABASE_VIEW', 'Bugs'),
        block('empty', 'TEXT', ' '),
      ],
    });
  });

  it('reads a named Page in order, without database views or empty blocks', async () => {
    expect(await references.collect(input)).toEqual({
      status: 'FOUND',
      references: [
        {
          label: 'S1',
          pageTitle: 'Bug tracker',
          text: 'Blocker',
          isHeading: true,
        },
        {
          label: 'S2',
          pageTitle: 'Bug tracker',
          text: 'Ứng dụng bị crash khi tải ảnh lớn',
          section: 'Blocker',
        },
      ],
      sources: [{ pageId: 'bugs', title: 'Bug tracker' }],
    });
    expect(resolve).toHaveBeenCalledWith({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      title: 'Bug tracker',
    });
    expect(searchPassages).not.toHaveBeenCalled();
  });

  it.each([
    [
      'several Pages with the name',
      { status: 'AMBIGUOUS', candidates: [bugs, bugs] },
    ],
    ['no Page with the name', { status: 'NOT_FOUND', candidates: [] }],
    ['the target Page itself', { status: 'RESOLVED', page: release }],
  ])('guesses nothing for %s', async (_name, found) => {
    resolve.mockResolvedValue(found);
    expect(await references.collect(input)).toEqual({ status: 'NOT_FOUND' });
  });

  it('reads nothing for a shared Page visitor', async () => {
    expect(await references.collect({ ...input, shareToken: 'share' })).toEqual(
      {
        status: 'NOT_FOUND',
      },
    );
    expect(resolve).not.toHaveBeenCalled();
  });

  it('looks for a topic among other Pages, within the budget', async () => {
    searchPassages.mockResolvedValue(
      Array.from({ length: 10 }, (_, index) => ({
        pageId: `p${index % 4}`,
        title: `Page ${index % 4}`,
        text: `${'ghi chú '.repeat(80)}${index}`,
        score: 0.9 - index / 100,
      })),
    );
    const found = await references.collect({
      ...input,
      basedOn: 'ghi chú QA gần đây',
    });
    expect(searchPassages).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'ghi chú QA gần đây',
        excludePageId: 'release',
        limit: 8,
        perPage: 3,
      }),
    );
    if (found.status !== 'FOUND') throw new Error('expected references');
    expect(found.references.every((item) => item.text.length <= 400)).toBe(
      true,
    );
    const bytes = found.references.reduce(
      (sum, item) => sum + Buffer.byteLength(item.text),
      0,
    );
    expect(bytes).toBeLessThanOrEqual(3000);
    expect(found.references.map((item) => item.label)).toEqual(
      found.references.map((_, index) => `S${index + 1}`),
    );
  });

  it('finds nothing when the search fails', async () => {
    searchPassages.mockRejectedValue(new Error('down'));
    expect(
      await references.collect({ ...input, basedOn: 'ghi chú QA' }),
    ).toEqual({
      status: 'NOT_FOUND',
    });
  });
});

describe('PageEmbeddingSearch.searchPassages (I3)', () => {
  const findWorkspaceVectors = jest.fn();
  const loadBlock = jest.fn();
  const getReadablePage = jest.fn();
  const search = new PageEmbeddingSearch(
    { findWorkspaceVectors, loadBlock } as unknown as PageEmbeddingStore,
    {
      embed: () =>
        Promise.resolve({ model: 'm1', dimensions: 2, embeddings: [[1, 0]] }),
    } as TextEmbedder,
    { getReadablePage } as unknown as AiConversationAccessService,
  );
  const row = (pageId: string, blockId: string, score: number) => ({
    pageId,
    blockId,
    resourceType: 'BLOCK',
    embedding: [score, Math.sqrt(1 - score * score)],
  });

  it('keeps the best blocks of readable Pages, a few per Page, never the target', async () => {
    findWorkspaceVectors.mockResolvedValue([
      row('qa', 'q1', 0.9),
      row('qa', 'q2', 0.85),
      row('qa', 'q3', 0.8),
      row('qa', 'q4', 0.79),
      row('release', 'r1', 0.95),
      row('secret', 's1', 0.99),
      row('notes', 'n1', 0.7),
      row('notes', 'n2', 0.3),
    ]);
    getReadablePage.mockImplementation((_user: string, pageId: string) =>
      pageId === 'secret'
        ? Promise.reject(new ForbiddenException())
        : Promise.resolve({
            getWorkspaceId: () => 'workspace-1',
            getTitle: () => pageId,
          }),
    );
    loadBlock.mockImplementation((_page: string, blockId: string) =>
      Promise.resolve(block(blockId, 'TEXT', `chữ ${blockId}`)),
    );
    const passages = await search.searchPassages({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      query: 'ghi chú QA',
      excludePageId: 'release',
      limit: 8,
      perPage: 3,
    });
    expect(passages.map((passage) => passage.text)).toEqual([
      'chữ q1',
      'chữ q2',
      'chữ q3',
      'chữ n1',
    ]);
    expect(findWorkspaceVectors).toHaveBeenCalledWith(
      'workspace-1',
      'm1',
      'BLOCK',
    );
    // The forbidden Page's block is never read.
    expect(loadBlock).not.toHaveBeenCalledWith('secret', 's1');
  });
});

describe('AiPageInstructionPlannerService: a draft based on a source (I3, I6, I7)', () => {
  const extract = jest.fn();
  const resolve = jest.fn();
  const generate = jest.fn();
  const collect = jest.fn();
  const service = new AiPageInstructionPlannerService(
    { extract } as unknown as PageIntentExtractionService,
    { resolve } as unknown as PageReferenceResolver,
    { generate } as unknown as AiModificationPlannerService,
    undefined,
    { collect } as unknown as PageSourceReferences,
  );
  const input = {
    userId: 'actor-1',
    workspaceId: 'workspace-1',
    requestId: 'request-1',
    instruction: sentence,
  };
  const found = {
    status: 'FOUND',
    references: [
      { label: 'S1', pageTitle: 'Bug tracker', text: 'Ứng dụng bị crash' },
    ],
    sources: [{ pageId: 'bugs', title: 'Bug tracker' }],
  };

  beforeEach(() => {
    jest.resetAllMocks();
    extract.mockResolvedValue({ result: titledIntent });
    resolve.mockResolvedValue({
      status: 'RESOLVED',
      page: release,
      resolutionMethod: 'EXACT_TITLE',
      confidence: 1,
    });
    collect.mockResolvedValue(found);
    generate.mockResolvedValue({ pageId: 'release', status: 'PLAN_READY' });
  });

  it('reads the source and drafts with it, a bare checklist included', async () => {
    expect(await service.generate(input)).toMatchObject({
      status: 'PLAN_GENERATED',
      page: release,
      sources: [{ pageId: 'bugs', title: 'Bug tracker' }],
    });
    expect(collect).toHaveBeenCalledWith({
      userId: 'actor-1',
      workspaceId: 'workspace-1',
      basedOn: 'trang Bug tracker',
      targetPageId: 'release',
      shareToken: undefined,
    });
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        instruction: 'thêm checklist các bug blocker',
        originalInstruction: sentence,
        references: found.references,
        sources: found.sources,
      }),
    );
  });

  it('tells the user when the source holds nothing readable', async () => {
    collect.mockResolvedValue({ status: 'NOT_FOUND' });
    expect(await service.generate(input)).toEqual({
      status: 'NEEDS_CLARIFICATION',
      reason: 'MISSING_SOURCE',
      intent: titledIntent,
    });
    expect(generate).not.toHaveBeenCalled();
  });

  it('still refuses an unsupported edit', async () => {
    extract.mockResolvedValue({
      result: { ...titledIntent, instruction: 'xoá trang' },
    });
    expect(
      await service.generate({
        ...input,
        instruction: 'xoá trang Release 2.0 dựa trên trang Bug tracker',
      }),
    ).toMatchObject({ status: 'UNSUPPORTED_OPERATION' });
    expect(collect).not.toHaveBeenCalled();
  });

  it('asks for checklist items when no source is named', async () => {
    extract.mockResolvedValue({
      result: {
        ...titledIntent,
        basedOn: undefined,
        instruction: 'thêm checklist',
      },
    });
    expect(
      await service.generate({
        ...input,
        instruction: 'thêm checklist vào trang Release 2.0',
      }),
    ).toMatchObject({
      status: 'NEEDS_CLARIFICATION',
      reason: 'MISSING_CHECKLIST_ITEMS',
    });
  });
});
