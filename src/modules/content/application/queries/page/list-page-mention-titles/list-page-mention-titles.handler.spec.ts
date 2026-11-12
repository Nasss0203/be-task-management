import { BadRequestException } from '@nestjs/common';

import {
  ListPageMentionTitlesHandler,
  MENTION_TITLES_LIMIT,
} from './list-page-mention-titles.handler';
import { ListPageMentionTitlesQuery } from './list-page-mention-titles.query';

const OPEN = '11111111-1111-4111-8111-111111111111';
const SECRET = '22222222-2222-4222-8222-222222222222';
const OTHER_WS = '33333333-3333-4333-8333-333333333333';
const DELETED = '44444444-4444-4444-8444-444444444444';
const MISSING = '55555555-5555-4555-8555-555555555555';

const page = (
  id: string,
  title: string,
  workspaceId = 'ws',
  deletedAt: Date | null = null,
) => ({
  getId: () => id,
  getTitle: () => title,
  getIcon: () => '📄',
  getWorkspaceId: () => workspaceId,
  getDeletedAt: () => deletedAt,
});

describe('ListPageMentionTitlesHandler', () => {
  const pages: Record<string, ReturnType<typeof page>> = {
    [OPEN]: page(OPEN, 'Plan'),
    [SECRET]: page(SECRET, 'Salary'),
    [OTHER_WS]: page(OTHER_WS, 'Other', 'ws-2'),
    [DELETED]: page(DELETED, 'Old', 'ws', new Date()),
  };
  const pageRepo = {
    findById: jest.fn((id: string) => Promise.resolve(pages[id] ?? null)),
  };
  const authorization = {
    authorize: jest.fn(({ target }: { target: { id: string } }) =>
      Promise.resolve(target.id !== SECRET),
    ),
  };
  const handler = new ListPageMentionTitlesHandler(
    pageRepo as never,
    authorization as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns the current title only for pages the viewer can read', async () => {
    const result = await handler.execute(
      new ListPageMentionTitlesQuery('ws', 'user', [OPEN, SECRET, MISSING]),
    );

    expect(result).toEqual({
      [OPEN]: { pageId: OPEN, title: 'Plan', icon: '📄' },
      [SECRET]: null,
      [MISSING]: null,
    });
    expect(JSON.stringify(result)).not.toContain('Salary');
  });

  it('hides pages from another workspace or in the trash without checking access', async () => {
    const result = await handler.execute(
      new ListPageMentionTitlesQuery('ws', 'user', [OTHER_WS, DELETED]),
    );

    expect(result).toEqual({ [OTHER_WS]: null, [DELETED]: null });
    expect(authorization.authorize).not.toHaveBeenCalled();
  });

  it('drops invalid ids and merges duplicates', async () => {
    const result = await handler.execute(
      new ListPageMentionTitlesQuery('ws', 'user', [
        OPEN,
        OPEN.toUpperCase(),
        'not-a-uuid',
      ]),
    );

    expect(Object.keys(result)).toEqual([OPEN]);
    expect(pageRepo.findById).toHaveBeenCalledTimes(1);
  });

  it('rejects more ids than the limit', async () => {
    const ids = Array.from(
      { length: MENTION_TITLES_LIMIT + 1 },
      (_, index) =>
        `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    );

    await expect(
      handler.execute(new ListPageMentionTitlesQuery('ws', 'user', ids)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
