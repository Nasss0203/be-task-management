import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NOTIFICATION_TYPES } from '../interfaces/types';

describe('NotificationsController', () => {
  let controller: NotificationsController;

  const mockApp = {
    findMyNotifications: jest.fn(),
    countUnread: jest.fn(),
  };

  const mockUpdateNotificationService = {
    markAllAsRead: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NOTIFICATION_TYPES.applications.FindNotificationApplication,
          useValue: mockApp,
        },
        {
          provide: NOTIFICATION_TYPES.services.UpdateNotificationService,
          useValue: mockUpdateNotificationService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should find my notifications', async () => {
    mockApp.findMyNotifications.mockResolvedValue([{ id: '1' }]);
    const result = await controller.findMyNotifications(
      { id: 'u-1' } as any,
      { limit: 10 } as any,
    );
    expect(mockApp.findMyNotifications).toHaveBeenCalled();
    expect(result[0].id).toEqual('1');
  });

  it('should count unread', async () => {
    mockApp.countUnread.mockResolvedValue({ count: 5 });
    const result = await controller.countUnread({ id: 'u-1' } as any);
    expect(mockApp.countUnread).toHaveBeenCalled();
    expect(result.count).toEqual(5);
  });
});
