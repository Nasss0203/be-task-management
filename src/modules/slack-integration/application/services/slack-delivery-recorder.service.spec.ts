import { SlackDeliveryError } from '../../domain/repositories/slack-connection.repository';
import {
  type SlackDeliveryEntry,
  SlackDeliveryStatus,
} from '../../domain/repositories/slack-delivery-log.repository';
import {
  SLACK_DELIVERY_RETENTION_MS,
  SlackDeliveryRecorder,
} from './slack-delivery-recorder.service';

describe('SlackDeliveryRecorder', () => {
  const log = {
    record: jest.fn<Promise<void>, [SlackDeliveryEntry]>(),
    deleteOlderThan: jest.fn(),
  };
  const recorder = new SlackDeliveryRecorder(log as never);
  const now = new Date('2026-11-26T10:00:00.000Z');
  const event = (title = 'Nam mentioned you') => ({
    recipientUserId: 'user-1',
    notification: {
      id: 'notification-1',
      type: 'comment.mentioned',
      title,
      message: 'secret text',
      actionUrl: '/page/page-1',
      workspaceId: 'workspace-1',
      sourceType: 'comment',
      sourceId: 'comment-1',
      metadata: null,
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    log.record.mockResolvedValue(undefined);
    log.deleteOlderThan.mockResolvedValue(undefined);
  });

  it('keeps the notification type and title but not the message or link', async () => {
    await recorder.record(
      event(),
      { status: SlackDeliveryStatus.SENT, error: null, attempts: 2 },
      now,
    );

    expect(log.record).toHaveBeenCalledWith({
      userId: 'user-1',
      notificationId: 'notification-1',
      notificationType: 'comment.mentioned',
      title: 'Nam mentioned you',
      status: SlackDeliveryStatus.SENT,
      error: null,
      attempts: 2,
      at: now,
    });
  });

  it('cuts long titles to 200 characters', async () => {
    await recorder.record(
      event('x'.repeat(250)),
      { status: SlackDeliveryStatus.SENT, error: null, attempts: 1 },
      now,
    );

    expect(log.record.mock.calls[0][0].title).toHaveLength(200);
  });

  it('removes the user log entries older than 30 days', async () => {
    await recorder.record(
      event(),
      {
        status: SlackDeliveryStatus.FAILED,
        error: SlackDeliveryError.RATE_LIMITED,
        attempts: 5,
      },
      now,
    );

    expect(log.deleteOlderThan).toHaveBeenCalledWith(
      'user-1',
      new Date(now.getTime() - SLACK_DELIVERY_RETENTION_MS),
    );
    expect(SLACK_DELIVERY_RETENTION_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it('does not throw when the log cannot be saved', async () => {
    log.record.mockRejectedValue(new Error('db down'));

    await expect(
      recorder.record(event(), {
        status: SlackDeliveryStatus.SENT,
        error: null,
        attempts: 1,
      }),
    ).resolves.toBeUndefined();
  });
});
