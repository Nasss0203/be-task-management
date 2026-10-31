import { ForbiddenException } from '@nestjs/common';
import type { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import type { AiConversationAccessService } from '../services/ai-conversation-access.service';
import type { AiModificationPlannerService } from '../services/ai-modification-planner.service';
import { AiPageInstructionPlannerService } from '../services/ai-page-instruction-planner.service';
import type { PageIntentExtractionService } from './page-intent-extraction.service';
import { PageReferenceResolver } from './page-reference-resolver.service';
import type { PageResolutionReader } from './page-resolution.port';
import type { PageResolutionCandidate } from './page-resolution.types';

// M3 (kế hoạch tên gần đúng): close titles for a typed name that matched nothing.
const page = (id: string, title: string) =>
  ({
    getId: () => id,
    getTitle: () => title,
    getWorkspaceId: () => 'workspace-1',
    getParentPageId: () => null,
    getTeamspaceId: () => null,
    getDeletedAt: () => null,
  }) as unknown as Page;
const ids = (result: { candidates: PageResolutionCandidate[] }) =>
  result.candidates.map((candidate) => candidate.pageId);

describe('PageReferenceResolver.resolveSimilarTitles (C3, C5)', () => {
  const pages = [
    page('release', 'Release 2.0'),
    page('release-1', 'Release 1.0'),
    page('secret', 'Release 2.0 nội bộ'),
    page('sub-man', 'sub man'),
    page('meeting', 'Hội họp tuần'),
  ];
  const findAccessibleTitlesInWorkspace = jest.fn();
  const getReadablePage = jest.fn();
  const resolver = new PageReferenceResolver(
    { findAccessibleTitlesInWorkspace } as unknown as PageResolutionReader,
    { getReadablePage } as unknown as AiConversationAccessService,
  );
  const input = {
    userId: 'user-1',
    workspaceId: 'workspace-1',
    shareToken: 'share',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    findAccessibleTitlesInWorkspace.mockResolvedValue(
      pages.map((p) => ({ id: p.getId(), title: p.getTitle() })),
    );
    getReadablePage.mockImplementation((_user: string, id: string) =>
      id === 'secret'
        ? Promise.reject(new ForbiddenException())
        : Promise.resolve(pages.find((p) => p.getId() === id)),
    );
  });

  it.each([
    ['relese 2', 'release'],
    ['realease 2.0', 'release'],
    ['release2', 'release'],
    ['sub mn', 'sub-man'],
    ['Hoi hp tuan', 'meeting'],
  ])('suggests %s → %s first', async (title, first) => {
    const result = await resolver.resolveSimilarTitles({ ...input, title });
    expect(result).toMatchObject({
      status: 'CANDIDATES',
      resolutionMethod: 'FUZZY_TITLE',
    });
    expect(ids(result)[0]).toBe(first);
  });

  it('never offers a Page the user cannot read', async () => {
    const result = await resolver.resolveSimilarTitles({
      ...input,
      title: 'relese 2.0',
    });
    expect(ids(result)).not.toContain('secret');
    expect(getReadablePage).toHaveBeenCalledWith('user-1', 'secret', 'share');
  });

  it('finds nothing below the threshold', async () => {
    expect(
      await resolver.resolveSimilarTitles({ ...input, title: 'xyz abc' }),
    ).toEqual({
      status: 'NOT_FOUND',
      candidates: [],
    });
    expect(getReadablePage).not.toHaveBeenCalled();
  });

  it('offers at most five, closest first', async () => {
    findAccessibleTitlesInWorkspace.mockResolvedValue(
      Array.from({ length: 8 }, (_, index) => ({
        id: `n${index}`,
        title: `Notes ${index}`,
      })),
    );
    getReadablePage.mockImplementation((_user: string, id: string) =>
      Promise.resolve(page(id, `Notes ${id.slice(1)}`)),
    );
    const result = await resolver.resolveSimilarTitles({
      ...input,
      title: 'Note 3',
    });
    expect(ids(result)).toHaveLength(5);
    expect(ids(result)[0]).toBe('n3');
  });
});

describe('AiPageInstructionPlannerService: close titles (C2, C4)', () => {
  const extract = jest.fn();
  const resolve = jest.fn();
  const resolveFromSentence = jest.fn();
  const resolveSimilarTitles = jest.fn();
  const plan = jest.fn();
  const service = new AiPageInstructionPlannerService(
    { extract } as unknown as PageIntentExtractionService,
    {
      resolve,
      resolveFromSentence,
      resolveSimilarTitles,
    } as unknown as PageReferenceResolver,
    { generate: plan } as unknown as AiModificationPlannerService,
  );
  const release = {
    pageId: 'release',
    workspaceId: 'workspace-1',
    title: 'Release 2.0',
    parentPageId: null,
    teamspaceId: null,
  };
  const intent = {
    intent: 'MODIFY_PAGE',
    referenceType: 'TITLE',
    pageReference: 'relese 2',
    instruction: 'Thêm checklist QA',
    needsClarification: false,
  };
  const input = {
    userId: 'actor-1',
    workspaceId: 'workspace-1',
    requestId: 'request-1',
    instruction: 'Thêm checklist QA vào trang relese 2',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    extract.mockResolvedValue({ result: intent });
    resolve.mockResolvedValue({ status: 'NOT_FOUND', candidates: [] });
    resolveFromSentence.mockResolvedValue({
      status: 'NOT_FOUND',
      candidates: [],
    });
    resolveSimilarTitles.mockResolvedValue({
      status: 'CANDIDATES',
      candidates: [release],
      resolutionMethod: 'FUZZY_TITLE',
    });
    plan.mockResolvedValue({ pageId: 'release', status: 'PLAN_READY' });
  });

  it('offers close titles only after exact and sentence matching found nothing', async () => {
    expect(await service.generate(input)).toEqual({
      status: 'AMBIGUOUS_PAGE',
      intent,
      candidates: [release],
      resolutionMethod: 'FUZZY_TITLE',
    });
    expect(resolveSimilarTitles).toHaveBeenCalledWith({
      userId: 'actor-1',
      workspaceId: 'workspace-1',
      title: 'relese 2',
      shareToken: undefined,
    });
    expect(plan).not.toHaveBeenCalled();
  });

  it('plans the picked Page only when it is still a close title', async () => {
    expect(
      await service.generate({ ...input, selectedPageId: 'release' }),
    ).toMatchObject({
      status: 'PLAN_GENERATED',
      resolutionMethod: 'FUZZY_TITLE',
    });
    expect(plan).toHaveBeenCalledWith(
      expect.objectContaining({ pageId: 'release' }),
    );
    plan.mockClear();
    expect(
      await service.generate({ ...input, selectedPageId: 'other' }),
    ).toMatchObject({ status: 'PAGE_NOT_FOUND' });
    expect(plan).not.toHaveBeenCalled();
  });

  it('keeps "not found" when nothing is close', async () => {
    resolveSimilarTitles.mockResolvedValue({
      status: 'NOT_FOUND',
      candidates: [],
    });
    expect(await service.generate(input)).toEqual({
      status: 'PAGE_NOT_FOUND',
      intent,
    });
  });

  it('is not reached when the sentence names a real Page', async () => {
    // M1b only returns titles that stand in the sentence.
    const named = { ...release, title: 'relese 2' };
    resolveFromSentence.mockResolvedValue({
      status: 'CANDIDATES',
      candidates: [named, { ...named, pageId: 'other' }],
      resolutionMethod: 'TITLE_IN_SENTENCE',
    });
    expect(await service.generate(input)).toMatchObject({
      resolutionMethod: 'TITLE_IN_SENTENCE',
    });
    expect(resolveSimilarTitles).not.toHaveBeenCalled();
  });

  it('is not used without a typed name', async () => {
    extract.mockResolvedValue({
      result: {
        ...intent,
        referenceType: 'UNRESOLVED',
        pageReference: null,
        needsClarification: true,
      },
    });
    expect(await service.generate(input)).toMatchObject({
      status: 'NEEDS_CLARIFICATION',
    });
    expect(resolveSimilarTitles).not.toHaveBeenCalled();
  });
});
