import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import { SlackConnectionError } from '../../../domain/repositories/slack-connection.repository';
import {
  SlackAuthError,
  SlackRetryableError,
  type SlackUnfurl,
  type SlackUnfurlTarget,
} from '../../ports/slack-client.port';
import { UnfurlSlackLinksCommand } from './unfurl-slack-links.command';
import {
  SLACK_UNFURL_LINK_LIMIT,
  UnfurlSlackLinksHandler,
} from './unfurl-slack-links.handler';

const PAGE_ID = '3f1c2b7e-8d4a-4c1e-9b2f-6a7d8e9f0a1b';
const PARENT_ID = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const ORIGIN = 'https://app.example';

const pageOf = (id: string, title: string, parentId: string | null = null) => ({
  getId: () => id,
  getTitle: () => title,
  getWorkspaceId: () => 'workspace-1',
  getParentPageId: () => parentId,
  getDeletedAt: () => null,
});

describe('UnfurlSlackLinksHandler', () => {
  const connection = {
    id: 'connection-1',
    userId: 'user-1',
    botTokenEncrypted: 'enc',
    lastError: null,
  };
  const connectionRepository = {
    findBySlackUser: jest.fn(),
    markError: jest.fn(),
  };
  const client = {
    unfurlLinks: jest.fn<
      Promise<void>,
      [string, SlackUnfurlTarget, Record<string, SlackUnfurl>]
    >(),
  };
  const sentUnfurls = () => client.unfurlLinks.mock.calls[0][2];
  const tokenCipher = { decrypt: jest.fn(() => 'xoxb-1') };
  const configService = {
    get: jest.fn((key: string) => (key === 'CLIENT_URL' ? ORIGIN : undefined)),
  };
  const authorization = { authorize: jest.fn() };
  const workspaces = { findById: jest.fn() };
  const pages = { findById: jest.fn() };
  const handler = new UnfurlSlackLinksHandler(
    connectionRepository as never,
    client as never,
    tokenCipher as never,
    configService as never,
    authorization as never,
    workspaces as never,
    pages as never,
  );
  const target = { channel: 'C1', messageTs: '123.456' };
  const unfurl = (urls: string[]) =>
    handler.execute(new UnfurlSlackLinksCommand('T1', 'U1', target, urls));

  beforeEach(() => {
    jest.clearAllMocks();
    connectionRepository.findBySlackUser.mockResolvedValue(connection);
    authorization.authorize.mockResolvedValue(true);
    workspaces.findById.mockResolvedValue({ getName: () => 'Acme & Co' });
    pages.findById.mockImplementation((id: string) =>
      Promise.resolve(
        id === PAGE_ID
          ? pageOf(PAGE_ID, 'Q4 <Roadmap>', PARENT_ID)
          : id === PARENT_ID
            ? pageOf(PARENT_ID, 'Plans')
            : null,
      ),
    );
  });

  it('previews a page the sharer can read with its title and location', async () => {
    const url = `${ORIGIN}/page/${PAGE_ID}`;

    await unfurl([url]);

    expect(connectionRepository.findBySlackUser).toHaveBeenCalledWith(
      'T1',
      'U1',
    );
    expect(authorization.authorize).toHaveBeenCalledWith({
      userId: 'user-1',
      permissions: [PERMISSIONS.PAGE_READ],
      target: { type: 'page', id: PAGE_ID },
    });
    expect(client.unfurlLinks).toHaveBeenCalledTimes(1);
    expect(client.unfurlLinks).toHaveBeenCalledWith('xoxb-1', target, {
      [url]: {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Q4 &lt;Roadmap&gt;*\nAcme &amp; Co › Plans',
            },
          },
        ],
      },
    });
  });

  it('previews a row link as its page and skips links that are not Taskmanly pages', async () => {
    const rowUrl = `${ORIGIN}/page/${PAGE_ID}/row/${PARENT_ID}`;

    await unfurl([
      rowUrl,
      `https://other.example/page/${PAGE_ID}`,
      `${ORIGIN}/page/not-a-uuid`,
      `${ORIGIN}/settings`,
      'not a url',
    ]);

    expect(Object.keys(sentUnfurls())).toEqual([rowUrl]);
  });

  it('hides the parent page when the sharer cannot read it', async () => {
    authorization.authorize.mockImplementation(
      ({ target: { id } }: { target: { id: string } }) =>
        Promise.resolve(id === PAGE_ID),
    );

    await unfurl([`${ORIGIN}/page/${PAGE_ID}`]);

    const [preview] = Object.values(sentUnfurls());
    expect(preview.blocks[0].text.text).toBe(
      '*Q4 &lt;Roadmap&gt;*\nAcme &amp; Co',
    );
  });

  it('previews at most a few links per message', async () => {
    pages.findById.mockResolvedValue(pageOf(PAGE_ID, 'Roadmap'));
    const urls = Array.from(
      { length: SLACK_UNFURL_LINK_LIMIT + 2 },
      (_, index) => `${ORIGIN}/page/${PAGE_ID}?v=${index}`,
    );

    await unfurl(urls);

    expect(Object.keys(sentUnfurls())).toHaveLength(SLACK_UNFURL_LINK_LIMIT);
  });

  it('does not call Slack when the sharer cannot read the page', async () => {
    authorization.authorize.mockResolvedValue(false);

    await unfurl([`${ORIGIN}/page/${PAGE_ID}`]);

    expect(client.unfurlLinks).not.toHaveBeenCalled();
  });

  it.each([
    ['has not connected Slack', null],
    [
      'lost Slack access',
      { ...connection, lastError: SlackConnectionError.ACCESS_REVOKED },
    ],
  ])('does nothing when the sharer %s', async (_, found) => {
    connectionRepository.findBySlackUser.mockResolvedValue(found);

    await unfurl([`${ORIGIN}/page/${PAGE_ID}`]);

    expect(pages.findById).not.toHaveBeenCalled();
    expect(client.unfurlLinks).not.toHaveBeenCalled();
  });

  it('marks the connection revoked when Slack rejects the token', async () => {
    client.unfurlLinks.mockRejectedValue(new SlackAuthError('token_revoked'));

    await unfurl([`${ORIGIN}/page/${PAGE_ID}`]);

    expect(connectionRepository.markError).toHaveBeenCalledWith(
      'connection-1',
      SlackConnectionError.ACCESS_REVOKED,
    );
  });

  it('lets the job retry other Slack failures', async () => {
    const error = new SlackRetryableError('503');
    client.unfurlLinks.mockRejectedValue(error);

    await expect(unfurl([`${ORIGIN}/page/${PAGE_ID}`])).rejects.toBe(error);
  });
});
