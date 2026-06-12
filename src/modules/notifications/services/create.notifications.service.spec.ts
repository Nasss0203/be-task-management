import { Test, TestingModule } from '@nestjs/testing';
import { CreateNotificationServiceImpl } from './create.notifications.service';
import { NOTIFICATION_TYPES } from '../interfaces/types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException } from '@nestjs/common';
import { NotificationType } from '../domain/entities/notification.entity';

describe('CreateNotificationServiceImpl', () => {
  let service: CreateNotificationServiceImpl;

  const mockRepo = {
    saveNotification: jest.fn(),
  };
  const mockEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateNotificationServiceImpl,
        { provide: NOTIFICATION_TYPES.repositories.CreateNotificationRepository, useValue: mockRepo },
        { provide: EventEmitter2, useValue: mockEmitter },
      ],
    }).compile();

    service = module.get<CreateNotificationServiceImpl>(CreateNotificationServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fail if no receiverId', async () => {
    await expect(service.createNotification({ receiverId: '', title: 'test', type: NotificationType.WORKSPACE_INVITE })).rejects.toThrow(BadRequestException);
  });

  it('should fail if no title', async () => {
    await expect(service.createNotification({ receiverId: 'u-1', title: '', type: NotificationType.WORKSPACE_INVITE })).rejects.toThrow(BadRequestException);
  });

  it('should create notification', async () => {
    mockRepo.saveNotification.mockResolvedValue({ id: '1', title: 'test', type: NotificationType.WORKSPACE_INVITE });
    const result = await service.createNotification({ receiverId: 'u-1', title: 'test', type: NotificationType.WORKSPACE_INVITE });
    expect(mockRepo.saveNotification).toHaveBeenCalled();
    expect(mockEmitter.emit).toHaveBeenCalled();
    expect(result.id).toEqual('1');
  });
});
