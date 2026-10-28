import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import type { AiConversationAccessService } from '../services/ai-conversation-access.service';
import type { PageResolutionReader } from './page-resolution.port';
import { PageReferenceResolver } from './page-reference-resolver.service';

const page = (id: string, title: string, workspaceId = 'workspace-1') => ({
  getId: () => id, getTitle: () => title, getWorkspaceId: () => workspaceId,
  getParentPageId: () => null, getTeamspaceId: () => null,
  getDeletedAt: () => null,
}) as unknown as Page;

describe('PageReferenceResolver Phase 1', () => {
  const input = { userId: 'user-1', workspaceId: 'workspace-1' };
  const a = page('page-1', 'Release 2.0');
  const b = page('page-2', 'Release 2.0');
  const findAccessibleByExactTitle = jest.fn();
  const getReadablePage = jest.fn();
  const resolver = new PageReferenceResolver(
    { findAccessibleByExactTitle } as unknown as PageResolutionReader,
    { getReadablePage } as unknown as AiConversationAccessService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    findAccessibleByExactTitle.mockResolvedValue([a]);
    getReadablePage.mockResolvedValue(a);
  });

  it('resolves an exact title with PAGE_READ and workspace scope', async () => {
    expect(await resolver.resolve({ ...input, title: 'Release 2.0' })).toEqual({
      status: 'RESOLVED', resolutionMethod: 'EXACT_TITLE', confidence: 1,
      page: { pageId: 'page-1', workspaceId: 'workspace-1', title: 'Release 2.0', parentPageId: null, teamspaceId: null },
    });
    expect(findAccessibleByExactTitle).toHaveBeenCalledWith('user-1', 'workspace-1', 'Release 2.0');
    expect(getReadablePage).toHaveBeenCalledWith('user-1', 'page-1', undefined);
  });

  it('returns candidates rather than guessing between duplicate names', async () => {
    findAccessibleByExactTitle.mockResolvedValue([a, b]);
    getReadablePage.mockImplementation(async (_user: string, id: string) => id === 'page-1' ? a : b);
    const result = await resolver.resolve({ ...input, title: 'Release 2.0' });
    expect(result.status).toBe('AMBIGUOUS');
    if (result.status === 'AMBIGUOUS') expect(result.candidates.map(x => x.pageId)).toEqual(['page-1', 'page-2']);
  });

  it('filters inaccessible candidates before returning any metadata', async () => {
    findAccessibleByExactTitle.mockResolvedValue([a, b]);
    getReadablePage.mockImplementation(async (_user: string, id: string) => {
      if (id === 'page-2') throw new ForbiddenException();
      return a;
    });
    const result = await resolver.resolve({ ...input, title: 'Release 2.0' });
    expect(result.status).toBe('RESOLVED');
  });

  it('does not reveal missing or denied pages', async () => {
    getReadablePage.mockRejectedValue(new NotFoundException());
    expect(await resolver.resolve({ ...input, title: 'Release 2.0' })).toEqual({ status: 'NOT_FOUND', candidates: [] });
  });

  it('resolves current context without invoking title search', async () => {
    const result = await resolver.resolve({ ...input, currentPageId: 'page-1' });
    expect(result).toMatchObject({ status: 'RESOLVED', resolutionMethod: 'CURRENT_CONTEXT' });
    expect(findAccessibleByExactTitle).not.toHaveBeenCalled();
  });

  it('rejects an out-of-workspace page without revealing its metadata', async () => {
    getReadablePage.mockResolvedValue(page('page-1', 'Private', 'workspace-2'));
    expect(await resolver.resolve({ ...input, currentPageId: 'page-1' })).toEqual({ status: 'NOT_FOUND', candidates: [] });
  });
});

describe('PageReferenceResolver.resolveFromSentence (M1b)', () => {
  const input = { userId: 'user-1', workspaceId: 'workspace-1', shareToken: 'share' };
  const subMan = page('sub-man', 'sub man');
  const meeting = page('meeting', 'Hội họp tuần');
  const secret = page('secret', 'Bí mật');
  const findAccessibleTitlesInWorkspace = jest.fn();
  const getReadablePage = jest.fn();
  const resolver = new PageReferenceResolver(
    { findAccessibleTitlesInWorkspace } as unknown as PageResolutionReader,
    { getReadablePage } as unknown as AiConversationAccessService,
  );
  const byId = new Map([subMan, meeting, secret].map((p) => [p.getId(), p]));
  // M1: the reader returns only id and title.
  const titled = (pages: Page[]) =>
    pages.map((p) => ({ id: p.getId(), title: p.getTitle() }));

  beforeEach(() => {
    jest.clearAllMocks();
    findAccessibleTitlesInWorkspace.mockResolvedValue(
      titled([subMan, meeting, secret]),
    );
    getReadablePage.mockImplementation(async (_user: string, id: string) => {
      if (id === 'secret') throw new ForbiddenException();
      return byId.get(id);
    });
  });

  it('offers a real Page named in the sentence, never resolving it directly', async () => {
    const result = await resolver.resolveFromSentence({
      ...input, instruction: 'thêm checklist vào trang hoi hop tuan',
    });
    expect(result).toEqual({
      status: 'CANDIDATES', resolutionMethod: 'TITLE_IN_SENTENCE',
      candidates: [{ pageId: 'meeting', workspaceId: 'workspace-1', title: 'Hội họp tuần', parentPageId: null, teamspaceId: null }],
    });
    expect(findAccessibleTitlesInWorkspace).toHaveBeenCalledWith(
      'user-1',
      'workspace-1',
    );
    expect(getReadablePage).toHaveBeenCalledWith('user-1', 'meeting', 'share');
  });

  it('does not reveal a matched Page the user cannot read', async () => {
    expect(await resolver.resolveFromSentence({
      ...input, instruction: 'thêm checklist vào trang Bí mật',
    })).toEqual({ status: 'NOT_FOUND', candidates: [] });
  });

  it('finds nothing without a Page name next to trang/page', async () => {
    expect(await resolver.resolveFromSentence({
      ...input, instruction: 'thêm checklist vào trang Q4',
    })).toEqual({ status: 'NOT_FOUND', candidates: [] });
    expect(getReadablePage).not.toHaveBeenCalled();
  });

  it('asks for a clearer name above five readable candidates', async () => {
    const many = Array.from({ length: 6 }, (_, i) => page(`same-${i}`, 'Notes'));
    findAccessibleTitlesInWorkspace.mockResolvedValue(titled(many));
    getReadablePage.mockImplementation(async (_user: string, id: string) => many.find((p) => p.getId() === id));
    expect(await resolver.resolveFromSentence({
      ...input, instruction: 'thêm checklist vào trang Notes',
    })).toEqual({ status: 'TOO_MANY', candidates: [] });
  });

  it('does not authorize an unbounded number of textual matches', async () => {
    const many = Array.from({ length: 26 }, (_, i) => page(`same-${i}`, 'Notes'));
    findAccessibleTitlesInWorkspace.mockResolvedValue(titled(many));
    expect(await resolver.resolveFromSentence({
      ...input, instruction: 'thêm checklist vào trang Notes',
    })).toEqual({ status: 'TOO_MANY', candidates: [] });
    expect(getReadablePage).not.toHaveBeenCalled();
  });
});
