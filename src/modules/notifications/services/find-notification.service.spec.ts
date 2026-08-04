import { Test, TestingModule } from '@nestjs/testing';
import { FindNotificationServiceImpl } from './find-notification.service';
import { NOTIFICATION_TYPES } from '../interfaces/types';
import { BadRequestException } from '@nestjs/common';

describe('FindNotificationServiceImpl', () => {
  let service: FindNotificationServiceImpl;

  const mockRepo = {
    findMyNotifications: jest.fn(),
    countUnread: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindNotificationServiceImpl,
        {
          provide: NOTIFICATION_TYPES.repositories.FindNotificationRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<FindNotificationServiceImpl>(
      FindNotificationServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fail if no userId in findMyNotifications', async () => {
    await expect(service.findMyNotifications({ userId: '' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should find my notifications', async () => {
    mockRepo.findMyNotifications.mockResolvedValue([{ id: '1' }]);
    const result = await service.findMyNotifications({ userId: 'u-1' });
    expect(mockRepo.findMyNotifications).toHaveBeenCalled();
    expect(result[0].id).toEqual('1');
  });

  it('should fail if no userId in countUnread', async () => {
    await expect(service.countUnread('')).rejects.toThrow(BadRequestException);
  });

  it('should count unread', async () => {
    mockRepo.countUnread.mockResolvedValue(5);
    const result = await service.countUnread('u-1');
    expect(mockRepo.countUnread).toHaveBeenCalled();
    expect(result).toEqual(5);
  });
});
