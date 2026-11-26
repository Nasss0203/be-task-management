import { PageResponseDto } from '../../../dto/page/response/page.response.dto';
import {
  DEFAULT_RECENT_PAGE_VISITS,
  ListRecentPageVisitsHandler,
  MAX_RECENT_PAGE_VISITS,
} from './list-recent-page-visits.handler';
import { ListRecentPageVisitsQuery } from './list-recent-page-visits.query';

describe('ListRecentPageVisitsHandler', () => {
  let pageRepo: { findRecentlyVisited: jest.Mock };
  let handler: ListRecentPageVisitsHandler;

  beforeEach(() => {
    pageRepo = { findRecentlyVisited: jest.fn().mockResolvedValue([]) };
    handler = new ListRecentPageVisitsHandler(pageRepo as never);
    jest
      .spyOn(PageResponseDto, 'fromDomain')
      .mockImplementation(
        (value) => ({ id: (value as unknown as { id: string }).id }) as never,
      );
  });

  it('keeps the repository order and adds when each page was visited', async () => {
    const latest = new Date('2026-11-24T10:00:00Z');
    const earlier = new Date('2026-11-24T09:00:00Z');
    pageRepo.findRecentlyVisited.mockResolvedValue([
      { page: { id: 'b' }, visitedAt: latest },
      { page: { id: 'a' }, visitedAt: earlier },
    ]);

    const result = await handler.execute(
      new ListRecentPageVisitsQuery('user-1', 'workspace-1'),
    );

    expect(pageRepo.findRecentlyVisited).toHaveBeenCalledWith(
      'workspace-1',
      'user-1',
      DEFAULT_RECENT_PAGE_VISITS,
    );
    expect(result).toEqual([
      { id: 'b', visitedAt: latest },
      { id: 'a', visitedAt: earlier },
    ]);
  });

  it.each([
    ['50', MAX_RECENT_PAGE_VISITS],
    ['5', 5],
    ['0', DEFAULT_RECENT_PAGE_VISITS],
    ['abc', DEFAULT_RECENT_PAGE_VISITS],
  ])('turns limit %s into %d', async (limit, expected) => {
    await handler.execute(
      new ListRecentPageVisitsQuery('user-1', 'workspace-1', limit),
    );

    expect(pageRepo.findRecentlyVisited).toHaveBeenCalledWith(
      'workspace-1',
      'user-1',
      expected,
    );
  });

  it('returns an empty list when nothing was visited', async () => {
    await expect(
      handler.execute(new ListRecentPageVisitsQuery('user-1', 'workspace-1')),
    ).resolves.toEqual([]);
  });
});
