import { NotificationType } from 'src/modules/notifications/domain/entities/notification.entity';
import { PageEditRequest } from '../../domain/entities/page-edit-request.entity';
import { PageEditRequestNotifier } from './page-edit-request-notifier.service';

describe('PageEditRequestNotifier', () => {
  const request = PageEditRequest.create({
    pageId: 'page',
    pageShareId: 'share',
    userId: 'requester',
  });

  const setup = () => {
    const notifications = {
      createNotificationOnce: jest.fn().mockResolvedValue(null),
      createNotification: jest.fn().mockResolvedValue(null),
    };
    const notificationRepository = {
      updatePageEditRequestNotificationStatus: jest.fn().mockResolvedValue(1),
    };
    const notifier = new PageEditRequestNotifier(
      {
        findReviewerIds: jest
          .fn()
          .mockResolvedValue(['owner', 'requester', 'admin']),
      } as never,
      notifications as never,
      notificationRepository as never,
      {
        findById: jest.fn().mockResolvedValue({
          getWorkspaceId: () => 'workspace',
          getTitle: () => 'Roadmap',
        }),
      } as never,
    );
    return { notifier, notifications, notificationRepository };
  };

  it('notifies each reviewer once, never the requester', async () => {
    const { notifier, notifications } = setup();

    await notifier.notifyReviewers(request);
    await notifier.notifyReviewers(request);

    const calls = notifications.createNotificationOnce.mock.calls as [
      string,
      { receiverId: string; type: string },
    ][];
    expect(calls.map(([, input]) => input.receiverId)).toEqual([
      'owner',
      'admin',
      'owner',
      'admin',
    ]);
    expect(calls[0][1].type).toBe(NotificationType.PAGE_EDIT_REQUESTED);
    expect(calls[0][0]).toBe(calls[2][0]);
    expect(calls[0][0]).not.toBe(calls[1][0]);
    expect(calls[0][0]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('marks the request notification and tells the requester', async () => {
    const { notifier, notifications, notificationRepository } = setup();
    request.approve('owner');

    await notifier.notifyReviewed(request, 'owner');

    expect(
      notificationRepository.updatePageEditRequestNotificationStatus,
    ).toHaveBeenCalledWith({
      editRequestId: request.getId(),
      status: 'APPROVED',
      reviewerId: 'owner',
    });
    expect(notifications.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        receiverId: 'requester',
        type: NotificationType.PAGE_EDIT_APPROVED,
      }),
    );
  });
});
