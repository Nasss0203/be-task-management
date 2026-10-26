import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { GetNotificationsHandler } from '../../../application/queries/get-notifications/get-notifications.handler';
import { GetNotificationsQuery } from '../../../application/queries/get-notifications/get-notifications.query';
import { GetUnreadCountHandler } from '../../../application/queries/get-unread-count/get-unread-count.handler';
import { NOTIFICATION_TYPES } from '../../../notifications.types';
import { NotificationsController } from './notification.controller';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_USER_ID = '33333333-3333-4333-8333-333333333333';
const NOTIFICATION_ID = '22222222-2222-4222-8222-222222222222';
const WORKSPACE_ID = '44444444-4444-4444-8444-444444444444';

/** Stands in for the global JwtAuthGuard: the caller is always USER_ID. */
class FakeJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    context.switchToHttp().getRequest<{ user?: { id: string } }>().user = {
      id: USER_ID,
    };
    return true;
  }
}

describe('NotificationsController (HTTP)', () => {
  let app: INestApplication;

  const getNotifications = {
    execute: jest.fn<Promise<unknown>, [GetNotificationsQuery]>(),
  };
  const getUnreadCount = { execute: jest.fn() };
  const updateNotifications = {
    markAllAsRead: jest.fn(),
    markAsRead: jest.fn(),
    updateInviteNotificationStatus: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: GetNotificationsHandler, useValue: getNotifications },
        { provide: GetUnreadCountHandler, useValue: getUnreadCount },
        {
          provide: NOTIFICATION_TYPES.services.UpdateNotificationService,
          useValue: updateNotifications,
        },
        { provide: APP_GUARD, useClass: FakeJwtGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    // Same options as main.ts.
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists the caller notifications with parsed filters', async () => {
    getNotifications.execute.mockResolvedValue([]);

    await request(app.getHttpServer())
      .get('/notifications')
      .query({
        limit: '20',
        unreadOnly: 'true',
        cursorId: NOTIFICATION_ID,
        cursor: '2026-10-24T10:00:00.000Z',
        workspaceId: WORKSPACE_ID,
        category: 'human',
      })
      .expect(200);

    const [query] = getNotifications.execute.mock.calls[0];
    expect(query.userId).toBe(USER_ID);
    expect(query.filters).toMatchObject({
      limit: 20,
      unreadOnly: true,
      cursorId: NOTIFICATION_ID,
      workspaceId: WORKSPACE_ID,
      category: 'human',
    });
    expect(query.filters.cursor).toEqual(new Date('2026-10-24T10:00:00.000Z'));
  });

  it('defaults unreadOnly to false', async () => {
    getNotifications.execute.mockResolvedValue([]);

    await request(app.getHttpServer()).get('/notifications').expect(200);

    expect(getNotifications.execute.mock.calls[0][0].filters.unreadOnly).toBe(
      false,
    );
  });

  it.each([
    'limit=0',
    'limit=101',
    'limit=abc',
    'cursor=not-a-date',
    'cursorId=123',
    'workspaceId=abc',
    'sourceId=abc',
    'category=other',
    'type=unknown.type',
    // The recipient always comes from the token, never from the query.
    `userId=${OTHER_USER_ID}`,
    `receiverId=${OTHER_USER_ID}`,
  ])('rejects %s with 400 before reaching the handler', async (query) => {
    await request(app.getHttpServer())
      .get(`/notifications?${query}`)
      .expect(400);

    expect(getNotifications.execute).not.toHaveBeenCalled();
  });

  it('counts unread notifications of the caller', async () => {
    getUnreadCount.execute.mockResolvedValue({ count: 5 });

    const response = await request(app.getHttpServer())
      .get('/notifications/unread-count')
      .expect(200);

    expect(response.body).toEqual({ count: 5 });
    expect(getUnreadCount.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: USER_ID }),
    );
  });

  it('routes read-all to the bulk update, not to :id/read', async () => {
    updateNotifications.markAllAsRead.mockResolvedValue(3);

    const response = await request(app.getHttpServer())
      .patch('/notifications/read-all')
      .expect(200);

    expect(response.body).toEqual({ updated: 3 });
    expect(updateNotifications.markAllAsRead).toHaveBeenCalledWith(USER_ID);
    expect(updateNotifications.markAsRead).not.toHaveBeenCalled();
  });

  it('marks one notification as read scoped to the caller', async () => {
    updateNotifications.markAsRead.mockResolvedValue(1);

    const response = await request(app.getHttpServer())
      .patch(`/notifications/${NOTIFICATION_ID}/read`)
      .expect(200);

    expect(response.body).toEqual({ updated: 1 });
    expect(updateNotifications.markAsRead).toHaveBeenCalledWith(
      NOTIFICATION_ID,
      USER_ID,
    );
  });

  it('rejects a non-UUID notification id with 400', async () => {
    await request(app.getHttpServer())
      .patch('/notifications/not-a-uuid/read')
      .expect(400);

    expect(updateNotifications.markAsRead).not.toHaveBeenCalled();
  });
});
