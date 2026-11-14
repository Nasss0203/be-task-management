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
    });
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
    });
  });
});
