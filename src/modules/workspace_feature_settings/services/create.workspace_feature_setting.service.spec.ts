import { Test, TestingModule } from '@nestjs/testing';
import { CreateWorkspaceFeatureSettingServiceImpl } from './create.workspace_feature_setting.service';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';

describe('CreateWorkspaceFeatureSettingServiceImpl', () => {
  let service: CreateWorkspaceFeatureSettingServiceImpl;

  const mockRepo = {
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateWorkspaceFeatureSettingServiceImpl,
        { provide: WORKSPACE_FEATURE_SETTING_TYPES.repositories.CreateWorkspaceFeatureSettingRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CreateWorkspaceFeatureSettingServiceImpl>(CreateWorkspaceFeatureSettingServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create setting', async () => {
    mockRepo.save.mockResolvedValue({ id: 'set-1' });
    const result = await service.create({
      workspaceId: 'ws-1',
      featureId: 'feat-1',
      enabled: true,
      createdBy: 'u-1',
      updatedBy: 'u-1',
      metadata: { key: 'val' },
    });
    expect(mockRepo.save).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      featureId: 'feat-1',
      enabled: true,
      createdBy: 'u-1',
      updatedBy: 'u-1',
      metadata: { key: 'val' },
    }, undefined);
    expect(result).toEqual({ id: 'set-1' });
  });

  it('should create setting with default values', async () => {
    mockRepo.save.mockResolvedValue({ id: 'set-1' });
    const result = await service.create({
      workspaceId: 'ws-1',
      featureId: 'feat-1',
    });
    expect(mockRepo.save).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      featureId: 'feat-1',
      enabled: false,
      createdBy: null,
      updatedBy: null,
      metadata: null,
    }, undefined);
    expect(result).toEqual({ id: 'set-1' });
  });
});
