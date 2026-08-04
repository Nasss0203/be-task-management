import { Test, TestingModule } from '@nestjs/testing';
import { UpdateWorkspaceFeatureSettingServiceImpl } from './update.workspace_feature_setting.service';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';

describe('UpdateWorkspaceFeatureSettingServiceImpl', () => {
  let service: UpdateWorkspaceFeatureSettingServiceImpl;

  const mockFindService = {
    findById: jest.fn(),
  };

  const mockRepo = {
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateWorkspaceFeatureSettingServiceImpl,
        {
          provide:
            WORKSPACE_FEATURE_SETTING_TYPES.services
              .FindWorkspaceFeatureSettingService,
          useValue: mockFindService,
        },
        {
          provide:
            WORKSPACE_FEATURE_SETTING_TYPES.repositories
              .UpdateWorkspaceFeatureSettingRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UpdateWorkspaceFeatureSettingServiceImpl>(
      UpdateWorkspaceFeatureSettingServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should update setting', async () => {
    const current = {
      id: 'set-1',
      workspaceId: 'ws-1',
      featureId: 'feat-1',
      enabled: false,
      createdBy: 'u-1',
      updatedBy: 'u-1',
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    mockFindService.findById.mockResolvedValue(current);
    mockRepo.save.mockResolvedValue({ ...current, enabled: true });

    const result = await service.update('set-1', { enabled: true });
    expect(mockFindService.findById).toHaveBeenCalledWith('set-1', undefined);
    expect(mockRepo.save).toHaveBeenCalledWith(
      {
        ...current,
        enabled: true,
      },
      undefined,
    );
    expect(result.enabled).toEqual(true);
  });
});
