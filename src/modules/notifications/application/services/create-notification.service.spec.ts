import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NotificationModel,
  NotificationSenderType,
  NotificationSourceType,
  NotificationType,
} from '../../domain/entities/notification.entity';
import type { NotificationRepository } from '../../domain/repositories/notification.repository';
import { CreateNotificationServiceImpl } from './create-notification.service';

const DELIVERY_ID = '22222222-2222-4222-8222-222222222222';
const RECEIVER_ID = '11111111-1111-4111-8111-111111111111';

function notification(): NotificationModel {
  return new NotificationModel(
    DELIVERY_ID,
    RECEIVER_ID,
    NotificationSenderType.SYSTEM,
    null,
    NotificationSourceType.TEAMSPACE,
    null,
    null,
    NotificationType.TEAMSPACE_INVITATION_RECEIVED,
    'Lời mời tham gia Teamspace',
    null,
    '/teamspaces/invitations',
    { invitationId: 'invitation-1' },
    null,
    null,
    new Date(),
    new Date(),
  );
}

describe('CreateNotificationServiceImpl.createNotificationOnce', () => {
  const insertNotificationIfAbsent = jest.fn<
    ReturnType<NotificationRepository['insertNotificationIfAbsent']>,
    Parameters<NotificationRepository['insertNotificationIfAbsent']>
  >();
  const emit = jest.fn();
  const service = new CreateNotificationServiceImpl(
    { insertNotificationIfAbsent } as unknown as NotificationRepository,
    { emit } as unknown as EventEmitter2,
  );

  const input = {
    receiverId: RECEIVER_ID,
    type: NotificationType.TEAMSPACE_INVITATION_RECEIVED,
    title: '  Lời mời tham gia Teamspace  ',
    actionUrl: '/teamspaces/invitations',
  };

  beforeEach(() => jest.clearAllMocks());

  it('uses the outbox delivery id as the notification id and emits once', async () => {
    insertNotificationIfAbsent.mockResolvedValue(notification());

    await service.createNotificationOnce(DELIVERY_ID, input);

    expect(insertNotificationIfAbsent).toHaveBeenCalledWith(
      expect.objectContaining({
        id: DELIVERY_ID,
        receiverId: RECEIVER_ID,
        title: 'Lời mời tham gia Teamspace',
        readAt: null,
      }),
    );
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(
      'notification.created',
      expect.objectContaining({ recipientUserId: RECEIVER_ID }),
    );
  });

  it('does not emit again when a retry finds the notification already stored', async () => {
    insertNotificationIfAbsent.mockResolvedValue(null);

    await expect(
      service.createNotificationOnce(DELIVERY_ID, input),
    ).resolves.toBeNull();

    expect(emit).not.toHaveBeenCalled();
  });

  it('rejects a missing recipient or blank title without writing', async () => {
    await expect(
      service.createNotificationOnce(DELIVERY_ID, { ...input, title: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.createNotificationOnce(DELIVERY_ID, { ...input, receiverId: '' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(insertNotificationIfAbsent).not.toHaveBeenCalled();
  });
});
