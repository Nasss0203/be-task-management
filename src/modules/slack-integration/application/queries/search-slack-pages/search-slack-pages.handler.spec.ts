import { SearchSlackPagesHandler } from './search-slack-pages.handler';
import { SearchSlackPagesQuery } from './search-slack-pages.query';

describe('SearchSlackPagesHandler', () => {
  const connectionRepository = { findBySlackUser: jest.fn() };
  const workspaces = { findByUserId: jest.fn() };
  const searchPages = { execute: jest.fn() };
  const configService = { get: jest.fn(() => undefined) };
  const handler = new SearchSlackPagesHandler(
    connectionRepository as never,
    workspaces as never,
    searchPages as never,
    configService as never,
  );
  const workspace = (id: string, name: string) => ({
    getId: () => id,
    getName: () => name,
  });
  const page = (pageId: string, title: string, updatedAt: string) => ({
    pageId,
    title,
    updatedAt: new Date(updatedAt),
  });
  const search = (text: string) =>
    handler.execute(new SearchSlackPagesQuery('T1', 'U1', text));

  beforeEach(() => {
    jest.clearAllMocks();
    connectionRepository.findBySlackUser.mockResolvedValue({
      userId: 'user-1',
      lastError: null,
    });
    workspaces.findByUserId.mockResolvedValue([workspace('ws-1', 'Acme')]);
    searchPages.execute.mockResolvedValue([]);
  });

  it('lists readable pages from every workspace, newest first', async () => {
    workspaces.findByUserId.mockResolvedValue([
      workspace('ws-1', 'Acme'),
      workspace('ws-2', 'R&D'),
    ]);
    searchPages.execute.mockImplementation(
      ({ workspaceId }: { workspaceId: string }) =>
        Promise.resolve(
          workspaceId === 'ws-1'
            ? [page('p-1', 'Roadmap', '2026-11-10T00:00:00Z')]
            : [page('p-2', '<Q4> roadmap', '2026-11-12T00:00:00Z')],
        ),
    );

    const response = await search('  roadmap ');

    expect(searchPages.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws-2',
        userId: 'user-1',
        query: 'roadmap',
      }),
    );
    expect(response).toEqual({
      response_type: 'ephemeral',
      text: [
        'Pages matching "roadmap":',
        '• <http://localhost:3000/page/p-2|&lt;Q4&gt; roadmap> · R&amp;D',
        '• <http://localhost:3000/page/p-1|Roadmap> · Acme',
      ].join('\n'),
    });
  });

  it('searches at most 5 workspaces and shows at most 10 pages', async () => {
    workspaces.findByUserId.mockResolvedValue(
      Array.from({ length: 7 }, (_, index) =>
        workspace(`ws-${index}`, `W${index}`),
      ),
    );
    searchPages.execute.mockImplementation(
      ({ workspaceId }: { workspaceId: string }) =>
        Promise.resolve([
          page(`${workspaceId}-a`, 'A', '2026-11-10T00:00:00Z'),
          page(`${workspaceId}-b`, 'B', '2026-11-11T00:00:00Z'),
          page(`${workspaceId}-c`, '', '2026-11-12T00:00:00Z'),
        ]),
    );

    const response = await search('a');

    expect(searchPages.execute).toHaveBeenCalledTimes(5);
    expect(response.text.split('\n')).toHaveLength(11);
    expect(response.text).toContain('|Untitled>');
  });

  it('says when nothing matches', async () => {
    await expect(search('<nothing>')).resolves.toEqual({
      response_type: 'ephemeral',
      text: 'No pages found for "&lt;nothing&gt;".',
    });
  });

  it.each(['', '   ', 'help', 'HELP'])(
    'explains the command for "%s"',
    async (text) => {
      const response = await search(text);

      expect(response.text).toContain('/taskmanly <words>');
      expect(searchPages.execute).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['not connected', null],
    ['revoked', { userId: 'user-1', lastError: 'ACCESS_REVOKED' }],
  ])(
    'asks to connect when the Slack user is %s',
    async (_label, connection) => {
      connectionRepository.findBySlackUser.mockResolvedValue(connection);

      const response = await search('roadmap');

      expect(connectionRepository.findBySlackUser).toHaveBeenCalledWith(
        'T1',
        'U1',
      );
      expect(response.text).toContain('Connect Slack in Taskmanly first');
      expect(workspaces.findByUserId).not.toHaveBeenCalled();
      expect(searchPages.execute).not.toHaveBeenCalled();
    },
  );
});
