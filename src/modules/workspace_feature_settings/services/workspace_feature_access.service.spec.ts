import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceFeatureAccessServiceImpl } from './workspace_feature_access.service';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';
import { ForbiddenException } from '@nestjs/common';

describe('WorkspaceFeatureAccessServiceImpl', () => {
  let service: WorkspaceFeatureAccessServiceImpl;

  const mockRepo = {
    findWorkspaceFeatures: jest.fn(),
    upsertWorkspaceFeatureSetting: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceFeatureAccessServiceImpl,
        { provide: WORKSPACE_FEATURE_SETTING_TYPES.repositories.WorkspaceFeatureAccessRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<WorkspaceFeatureAccessServiceImpl>(WorkspaceFeatureAccessServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find workspace features', async () => {
    mockRepo.findWorkspaceFeatures.mockResolvedValue([{ id: 'wf-1' }]);
    const result = await service.findWorkspaceFeatures('ws-1');
    expect(mockRepo.findWorkspaceFeatures).toHaveBeenCalledWith('ws-1');
    expect(result).toEqual([{ id: 'wf-1' }]);
  });

  it('should update workspace feature', async () => {
    mockRepo.upsertWorkspaceFeatureSetting.mockResolvedValue({ id: 'wf-1' });
    const result = await service.updateWorkspaceFeature({
      workspaceId: 'ws-1',
      featureCode: 'feat-1',
      enabled: true,
      userId: 'u-1',
    });
    expect(mockRepo.upsertWorkspaceFeatureSetting).toHaveBeenCalled();
    expect(result).toEqual({ id: 'wf-1' });
  });

  it('should throw ForbiddenException if feature is not available for current plan', async () => {
    mockRepo.upsertWorkspaceFeatureSetting.mockRejectedValue(new Error('Feature is not available for current plan'));
    await expect(service.updateWorkspaceFeature({
      workspaceId: 'ws-1',
      featureCode: 'feat-1',
      enabled: true,
      userId: 'u-1',
    })).rejects.toThrow(ForbiddenException);
  });

  it('should rethrow other errors', async () => {
    mockRepo.upsertWorkspaceFeatureSetting.mockRejectedValue(new Error('Some other error'));
    await expect(service.updateWorkspaceFeature({
      workspaceId: 'ws-1',
      featureCode: 'feat-1',
      enabled: true,
      userId: 'u-1',
    })).rejects.toThrow('Some other error');
  });
});
