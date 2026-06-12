import { Test, TestingModule } from '@nestjs/testing';
import { FindNotificationApplicationImpl } from './find-notification.application';
import { NOTIFICATION_TYPES } from '../interfaces/types';

describe('FindNotificationApplicationImpl', () => {
  let application: FindNotificationApplicationImpl;

  const mockService = {
    findMyNotifications: jest.fn(),
    countUnread: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindNotificationApplicationImpl,
        { provide: NOTIFICATION_TYPES.services.FindNotificationService, useValue: mockService },
      ],
    }).compile();

    application = module.get<FindNotificationApplicationImpl>(FindNotificationApplicationImpl);
  });

  it('should be defined', () => {
    expect(application).toBeDefined();
  });

  it('should find my notifications', async () => {
    mockService.findMyNotifications.mockResolvedValue([{ id: '1' }]);
    const result = await application.findMyNotifications({
      userId: 'u-1',
      cursor: new Date().toISOString(),
      limit: 10,
    });
    expect(mockService.findMyNotifications).toHaveBeenCalled();
    expect(result[0].id).toEqual('1');
  });

  it('should count unread', async () => {
    mockService.countUnread.mockResolvedValue(5);
    const result = await application.countUnread('u-1');
    expect(mockService.countUnread).toHaveBeenCalled();
    expect(result.count).toEqual(5);
  });
});
