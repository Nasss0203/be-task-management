import { SlackDeliveryError } from '../../../domain/repositories/slack-connection.repository';
import { GetSlackStatusHandler } from './get-slack-status.handler';
import { GetSlackStatusQuery } from './get-slack-status.query';

describe('GetSlackStatusHandler', () => {
  const connectionRepository = { findByUserId: jest.fn() };
  const handler = new GetSlackStatusHandler(connectionRepository as never);

  it('returns the last delivery and failure of the connection', async () => {
    const deliveredAt = new Date('2026-11-14T08:00:00Z');
    const failedAt = new Date('2026-11-14T09:00:00Z');
    connectionRepository.findByUserId.mockResolvedValue({
      slackTeamName: 'Acme',
      lastError: null,
      lastDeliveredAt: deliveredAt,
      lastDeliveryFailedAt: failedAt,
      lastDeliveryError: SlackDeliveryError.RATE_LIMITED,
      grantedScopes: ['chat:write', 'commands', 'links:read', 'links:write'],
    });

    await expect(
      handler.execute(new GetSlackStatusQuery('user-1')),
    ).resolves.toEqual({
      connected: true,
      slackTeamName: 'Acme',
      connectionError: null,
      lastDeliveredAt: deliveredAt,
      lastDeliveryFailedAt: failedAt,
      lastDeliveryError: SlackDeliveryError.RATE_LIMITED,
      missingScopes: [],
    });
  });

  it.each([
    ['saved before scopes were stored', null],
    ['granted only chat:write', ['chat:write']],
  ])('asks to reconnect a connection %s', async (_label, grantedScopes) => {
    connectionRepository.findByUserId.mockResolvedValue({
      slackTeamName: 'Acme',
      lastError: null,
      lastDeliveredAt: null,
      lastDeliveryFailedAt: null,
      lastDeliveryError: null,
      grantedScopes,
    });

    const status = await handler.execute(new GetSlackStatusQuery('user-1'));

    expect(status.missingScopes).toEqual([
      'commands',
      'links:read',
      'links:write',
    ]);
  });

  it('returns empty delivery fields when Slack is not connected', async () => {
    connectionRepository.findByUserId.mockResolvedValue(null);

    await expect(
      handler.execute(new GetSlackStatusQuery('user-1')),
    ).resolves.toEqual({
      connected: false,
      slackTeamName: null,
      connectionError: null,
      lastDeliveredAt: null,
      lastDeliveryFailedAt: null,
      lastDeliveryError: null,
      missingScopes: [],
    });
  });
});
