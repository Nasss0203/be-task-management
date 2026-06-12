import { Test, TestingModule } from '@nestjs/testing';
import { FeatureAccessServiceImpl } from './feature-access.service';
import { FEATURE_TYPES } from '../interfaces/types';
import { ForbiddenException } from '@nestjs/common';

describe('FeatureAccessServiceImpl', () => {
  let service: FeatureAccessServiceImpl;
  const mockRepo = {
    existsUserWorkspaceMembership: jest.fn(),
    isFeatureEnabledForWorkspace: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureAccessServiceImpl,
        { provide: FEATURE_TYPES.repositories.FeatureAccessRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<FeatureAccessServiceImpl>(FeatureAccessServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should assert user workspace membership', async () => {
    mockRepo.existsUserWorkspaceMembership.mockResolvedValue(true);
    await service.assertUserWorkspaceMembership('u-1', 'ws-1');
    expect(mockRepo.existsUserWorkspaceMembership).toHaveBeenCalledWith('u-1', 'ws-1');
  });

  it('should throw if not a member', async () => {
    mockRepo.existsUserWorkspaceMembership.mockResolvedValue(false);
    await expect(service.assertUserWorkspaceMembership('u-1', 'ws-1')).rejects.toThrow(ForbiddenException);
  });

  it('should assert feature enabled for workspace', async () => {
    mockRepo.isFeatureEnabledForWorkspace.mockResolvedValue(true);
    await service.assertFeatureEnabledForWorkspace('ws-1', 'f-1');
    expect(mockRepo.isFeatureEnabledForWorkspace).toHaveBeenCalledWith('ws-1', 'f-1');
  });

  it('should throw if feature not enabled for workspace', async () => {
    mockRepo.isFeatureEnabledForWorkspace.mockResolvedValue(false);
    await expect(service.assertFeatureEnabledForWorkspace('ws-1', 'f-1')).rejects.toThrow(ForbiddenException);
  });

  it('should return if feature enabled', async () => {
    mockRepo.isFeatureEnabledForWorkspace.mockResolvedValue(true);
    const result = await service.isFeatureEnabledForWorkspace('ws-1', 'f-1');
    expect(result).toEqual(true);
  });
});
