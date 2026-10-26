import {
  buildSnippet,
  escapeLikePattern,
  normalizeSearchText,
} from '../../../services/search-text';
import { SearchPagesHandler, SEARCH_RESULT_LIMIT } from './search-pages.handler';
import { SearchPagesQuery } from './search-pages.query';

const row = (pageId: string, overrides: Record<string, unknown> = {}) => ({
  pageId,
  title: `Page ${pageId}`,
  icon: null,
  teamspaceId: null,
  parentPageId: null,
  updatedAt: new Date('2026-10-25'),
  matchedInTitle: true,
  snippet: null,
  ...overrides,
});

describe('search text helpers', () => {
  it('folds Vietnamese accents, case and spaces', () => {
    expect(normalizeSearchText('  KẾ   Hoạch Đồ án ')).toBe('ke hoach do an');
  });

  it('escapes LIKE wildcards in user input', () => {
    expect(escapeLikePattern('50%_a\\b')).toBe('50\\%\\_a\\\\b');
  });

  it('cuts a snippet around the match and collapses whitespace', () => {
    const text = `${'x'.repeat(100)} Lên kế hoạch\n  sprint ${'y'.repeat(100)}`;
    const snippet = buildSnippet(text, 'ke hoach', 10);

    expect(snippet.startsWith('…')).toBe(true);
    expect(snippet.endsWith('…')).toBe(true);
    expect(snippet).toContain('Lên kế hoạch sprint');
  });
});

describe('SearchPagesHandler', () => {
  const reader = { search: jest.fn() };
  const authorization = { authorize: jest.fn() };
  const handler = new SearchPagesHandler(reader, authorization as never);

  beforeEach(() => jest.clearAllMocks());

  it('passes the normalized query and drops pages the user cannot read', async () => {
    reader.search.mockResolvedValue([
      row('a'),
      row('secret', { matchedInTitle: false, snippet: 'mật khẩu ke hoach' }),
      row('b', { matchedInTitle: false, snippet: 'Lên kế hoạch' }),
    ]);
    authorization.authorize.mockImplementation(({ target }) =>
      Promise.resolve(target.id !== 'secret'),
    );

    const result = await handler.execute(
      new SearchPagesQuery('ws', 'user', '  KẾ hoạch '),
    );

    expect(reader.search).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: 'ws', userId: 'user', normalizedQuery: 'ke hoach' }),
    );
    expect(result.map((item) => item.pageId)).toEqual(['a', 'b']);
    expect(result[0].matchedIn).toBe('title');
    expect(result[1]).toMatchObject({ matchedIn: 'content', snippet: 'Lên kế hoạch' });
    expect(JSON.stringify(result)).not.toContain('mật khẩu');
  });

  it('returns recent pages without match info for an empty query', async () => {
    reader.search.mockResolvedValue([row('a')]);
    authorization.authorize.mockResolvedValue(true);

    const [item] = await handler.execute(new SearchPagesQuery('ws', 'user', '   '));

    expect(item).toMatchObject({ matchedIn: null, snippet: null });
  });

  it('caps the number of results', async () => {
    reader.search.mockResolvedValue(
      Array.from({ length: 40 }, (_, index) => row(String(index))),
    );
    authorization.authorize.mockResolvedValue(true);

    const result = await handler.execute(new SearchPagesQuery('ws', 'user', 'page'));

    expect(result).toHaveLength(SEARCH_RESULT_LIMIT);
  });
});
