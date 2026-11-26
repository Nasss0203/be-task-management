import { BadRequestException } from '@nestjs/common';

import {
  DATABASE_MENTION_TITLES_LIMIT,
  ListDatabaseMentionTitlesHandler,
} from './list-database-mention-titles.handler';
import { ListDatabaseMentionTitlesQuery } from './list-database-mention-titles.query';

const OPEN_DB = '11111111-1111-4111-8111-111111111111';
const SECRET_DB = '22222222-2222-4222-8222-222222222222';
const TRASHED_DB = '33333333-3333-4333-8333-333333333333';
const OTHER_WS_DB = '44444444-4444-4444-8444-444444444444';
const MISSING_DB = '55555555-5555-4555-8555-555555555555';

const database = (id: string, name: string, pageId: string) => ({
  getId: () => id,
  getName: () => name,
  getPageId: () => pageId,
});

const page = (id: string, workspaceId = 'ws') => ({
  getId: () => id,
  getWorkspaceId: () => workspaceId,
  getDeletedAt: () => null,
});

const viewBlock = (databaseId: string, deletedAt: Date | null = null) => ({
  getReferencedDatabaseId: () => databaseId,
  getDeletedAt: () => deletedAt,
});

describe('ListDatabaseMentionTitlesHandler', () => {
  const databases: Record<string, ReturnType<typeof database>> = {
    [OPEN_DB]: database(OPEN_DB, 'Release Tasks', 'page-open'),
    [SECRET_DB]: database(SECRET_DB, 'Salaries', 'page-secret'),
    [TRASHED_DB]: database(TRASHED_DB, 'Old Tasks', 'page-open'),
    [OTHER_WS_DB]: database(OTHER_WS_DB, 'Other', 'page-other'),
  };
  const pages: Record<string, ReturnType<typeof page>> = {
    'page-open': page('page-open'),
    'page-secret': page('page-secret'),
    'page-other': page('page-other', 'ws-2'),
  };
  const databaseRepo = {
    findById: jest.fn((id: string) => Promise.resolve(databases[id] ?? null)),
  };
  const pageRepo = {
    findById: jest.fn((id: string) => Promise.resolve(pages[id] ?? null)),
  };
  const pageBlockRepo = {
    findDatabaseViewBlocksByPageIds: jest.fn(() =>
      Promise.resolve([
        viewBlock(OPEN_DB),
        viewBlock(SECRET_DB),
        viewBlock(OTHER_WS_DB),
        viewBlock(TRASHED_DB, new Date()),
      ]),
    ),
  };
  const authorization = {
    authorize: jest.fn(({ target }: { target: { id: string } }) =>
      Promise.resolve(target.id !== 'page-secret'),
    ),
  };
  const handler = new ListDatabaseMentionTitlesHandler(
    databaseRepo as never,
    pageRepo as never,
    pageBlockRepo as never,
    authorization as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns the current name only for live databases the viewer can read', async () => {
    const result = await handler.execute(
      new ListDatabaseMentionTitlesQuery('ws', 'user', [
        OPEN_DB,
        SECRET_DB,
        TRASHED_DB,
        OTHER_WS_DB,
        MISSING_DB,
      ]),
    );

    expect(result).toEqual({
      [OPEN_DB]: {
        databaseId: OPEN_DB,
        name: 'Release Tasks',
        pageId: 'page-open',
      },
      [SECRET_DB]: null,
      [TRASHED_DB]: null,
      [OTHER_WS_DB]: null,
      [MISSING_DB]: null,
    });
    expect(JSON.stringify(result)).not.toContain('Salaries');
  });

  it('skips ids that are not uuids and checks each page once', async () => {
    const result = await handler.execute(
      new ListDatabaseMentionTitlesQuery('ws', 'user', [
        'not-a-uuid',
        OPEN_DB,
        OPEN_DB.toUpperCase(),
        TRASHED_DB,
      ]),
    );

    expect(Object.keys(result)).toEqual([OPEN_DB, TRASHED_DB]);
    expect(databaseRepo.findById).toHaveBeenCalledTimes(2);
    expect(authorization.authorize).toHaveBeenCalledTimes(1);
  });

  it('rejects more ids than the limit', async () => {
    const ids = Array.from(
      { length: DATABASE_MENTION_TITLES_LIMIT + 1 },
      (_, index) =>
        `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    );

    await expect(
      handler.execute(new ListDatabaseMentionTitlesQuery('ws', 'user', ids)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
