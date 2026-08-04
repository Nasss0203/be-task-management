import { Test, TestingModule } from '@nestjs/testing';
import { CreateNotificationApplicationImpl } from './create.notifications.application';
import { NOTIFICATION_TYPES } from '../interfaces/types';
import { NotificationType } from '../domain/entities/notification.entity';

describe('CreateNotificationApplicationImpl', () => {
  let application: CreateNotificationApplicationImpl;

  const mockService = {
    createNotification: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateNotificationApplicationImpl,
        {
          provide: NOTIFICATION_TYPES.services.CreateNotificationService,
          useValue: mockService,
        },
      ],
    }).compile();

    application = module.get<CreateNotificationApplicationImpl>(
      CreateNotificationApplicationImpl,
    );
  });

  it('should be defined', () => {
    expect(application).toBeDefined();
  });

  it('should create notification', async () => {
    mockService.createNotification.mockResolvedValue({ id: '1' });
    const result = await application.createNotification({
      receiverId: 'u-1',
      title: 'Title',
      type: NotificationType.WORKSPACE_INVITE,
    });
    expect(mockService.createNotification).toHaveBeenCalled();
    expect(result.id).toEqual('1');
  });
});
