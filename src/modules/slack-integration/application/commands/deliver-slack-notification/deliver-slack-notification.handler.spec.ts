import { SlackConnectionError } from '../../../domain/repositories/slack-connection.repository';
import {
  SlackAuthError,
  SlackRetryableError,
} from '../../ports/slack-client.port';
import { DeliverSlackNotificationCommand } from './deliver-slack-notification.command';
import { DeliverSlackNotificationHandler } from './deliver-slack-notification.handler';

describe('DeliverSlackNotificationHandler', () => {
  const connection = {
    id: 'connection-1',
    userId: 'user-1',
    slackTeamId: 'T1',
    slackTeamName: 'Acme',
    slackUserId: 'U1',
    botTokenEncrypted: 'enc',
    lastError: null,
  };
  const connectionRepository = {
    findByUserId: jest.fn(),
    markError: jest.fn(),
  };
  const client = { postDirectMessage: jest.fn() };
  const tokenCipher = { decrypt: jest.fn(() => 'xoxb-1') };
  const configService = { get: jest.fn(() => undefined) };
  const workspaces = { findById: jest.fn() };
  const pages = { findById: jest.fn() };
  const handler = new DeliverSlackNotificationHandler(
    connectionRepository as never,
    client as never,
    tokenCipher as never,
    configService as never,
    workspaces as never,
    pages as never,
  );
  const deliver = (notification = {}) =>
    handler.execute(
      new DeliverSlackNotificationCommand({
        recipientUserId: 'user-1',
        notification: {
          id: 'notification-1',
          type: 'comment.mentioned',
          title: 'Nam mentioned you',
          message: null,
          actionUrl: '/page/page-1',
          workspaceId: 'workspace-1',
          sourceType: 'comment',
          sourceId: 'comment-1',
          metadata: { pageId: 'page-1' },
          ...notification,
        },
      }),
    );

  beforeEach(() => {
    jest.clearAllMocks();
    connectionRepository.findByUserId.mockResolvedValue(connection);
    workspaces.findById.mockResolvedValue(null);
    pages.findById.mockResolvedValue(null);
  });

  it('sends the notification with a link back to the app', async () => {
    await deliver({ message: 'Looks good' });

    expect(tokenCipher.decrypt).toHaveBeenCalledWith('enc');
    expect(client.postDirectMessage).toHaveBeenCalledWith(
      'xoxb-1',
      'U1',
      '*Nam mentioned you*\nLooks good\n<http://localhost:3000/page/page-1|Open in Taskmanly>',
      'comment-1',
    );
  });

  it('escapes Slack control characters typed by users', async () => {
    await deliver({
      title: '<!channel> & co',
      message: '<https://evil|click>',
      actionUrl: null,
    });

    expect(client.postDirectMessage).toHaveBeenCalledWith(
      'xoxb-1',
      'U1',
      '*&lt;!channel&gt; &amp; co*\n&lt;https://evil|click&gt;',
      'comment-1',
    );
  });

  it('shows the escaped workspace and page the notification came from', async () => {
    workspaces.findById.mockResolvedValue({ getName: () => 'R&D' });
    pages.findById.mockResolvedValue({ getTitle: () => '<Roadmap>' });

    await deliver({ actionUrl: null });

    expect(workspaces.findById).toHaveBeenCalledWith('workspace-1');
    expect(pages.findById).toHaveBeenCalledWith('page-1');
    expect(client.postDirectMessage).toHaveBeenCalledWith(
      'xoxb-1',
      'U1',
      '*Nam mentioned you*\nR&amp;D › &lt;Roadmap&gt;',
      'comment-1',
    );
  });

  it('reads the page from the source of page notifications', async () => {
    pages.findById.mockResolvedValue({ getTitle: () => '' });

    await deliver({
      type: 'page.access.approved',
      sourceType: 'page',
      sourceId: 'page-2',
      metadata: null,
      workspaceId: null,
      actionUrl: null,
    });

    expect(workspaces.findById).not.toHaveBeenCalled();
    expect(pages.findById).toHaveBeenCalledWith('page-2');
    expect(client.postDirectMessage).toHaveBeenCalledWith(
      'xoxb-1',
      'U1',
      '*Nam mentioned you*\nUntitled',
      null,
    );
  });

  it('hides the page from people whose access was rejected', async () => {
    await deliver({
      type: 'page.access.rejected',
      sourceType: 'page',
      sourceId: 'page-2',
      actionUrl: null,
    });

    expect(workspaces.findById).not.toHaveBeenCalled();
    expect(pages.findById).not.toHaveBeenCalled();
    expect(client.postDirectMessage).toHaveBeenCalledWith(
      'xoxb-1',
      'U1',
      '*Nam mentioned you*',
      null,
    );
  });

  it.each([
    ['not connected', null],
    [
      'revoked',
      { ...connection, lastError: SlackConnectionError.ACCESS_REVOKED },
    ],
  ])('sends nothing when Slack is %s', async (_label, current) => {
    connectionRepository.findByUserId.mockResolvedValue(current);

    await deliver();

    expect(client.postDirectMessage).not.toHaveBeenCalled();
  });

  it('marks the connection revoked instead of retrying', async () => {
    client.postDirectMessage.mockRejectedValue(
      new SlackAuthError('token_revoked'),
    );

    await expect(deliver()).resolves.toBeUndefined();
    expect(connectionRepository.markError).toHaveBeenCalledWith(
      'connection-1',
      SlackConnectionError.ACCESS_REVOKED,
    );
  });

  it('lets the job retry when Slack fails for a while', async () => {
    client.postDirectMessage.mockRejectedValue(
      new SlackRetryableError('ratelimited'),
    );

    await expect(deliver()).rejects.toBeInstanceOf(SlackRetryableError);
    expect(connectionRepository.markError).not.toHaveBeenCalled();
  });
});
