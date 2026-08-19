import { Test, TestingModule } from '@nestjs/testing';
import { UpdateNotificationServiceImpl } from './update-notification.service';
import { NOTIFICATION_TYPES } from '../interfaces/types';
import { BadRequestException } from '@nestjs/common';
import { WorkspaceInviteStatus } from 'src/modules/workspace/domain/enums/workspace-invite-status.enum';

describe('UpdateNotificationServiceImpl', () => {
  let service: UpdateNotificationServiceImpl;

  const mockRepo = {
    updateInviteNotificationStatus: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateNotificationServiceImpl,
        {
          provide: NOTIFICATION_TYPES.repositories.UpdateNotificationRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UpdateNotificationServiceImpl>(
      UpdateNotificationServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fail if no inviteId', async () => {
    await expect(
      service.updateInviteNotificationStatus({
        inviteId: '',
        inviteStatus: WorkspaceInviteStatus.ACCEPTED,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should fail if no inviteStatus', async () => {
    await expect(
      service.updateInviteNotificationStatus({
        inviteId: 'inv-1',
        inviteStatus: '' as any,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should update status', async () => {
    mockRepo.updateInviteNotificationStatus.mockResolvedValue(1);
    const result = await service.updateInviteNotificationStatus({
      inviteId: 'inv-1',
      inviteStatus: WorkspaceInviteStatus.ACCEPTED,
    });
    expect(mockRepo.updateInviteNotificationStatus).toHaveBeenCalled();
    expect(result).toEqual(1);
  });
});
