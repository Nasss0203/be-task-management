import { Test, TestingModule } from '@nestjs/testing';
import { DeleteWorkspaceFeatureSettingServiceImpl } from './delete.workspace_feature_setting.service';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';

describe('DeleteWorkspaceFeatureSettingServiceImpl', () => {
  let service: DeleteWorkspaceFeatureSettingServiceImpl;

  const mockFindService = {
    findById: jest.fn(),
  };

  const mockRepo = {
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteWorkspaceFeatureSettingServiceImpl,
        { provide: WORKSPACE_FEATURE_SETTING_TYPES.services.FindWorkspaceFeatureSettingService, useValue: mockFindService },
        { provide: WORKSPACE_FEATURE_SETTING_TYPES.repositories.DeleteWorkspaceFeatureSettingRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<DeleteWorkspaceFeatureSettingServiceImpl>(DeleteWorkspaceFeatureSettingServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should delete setting', async () => {
    mockFindService.findById.mockResolvedValue({ id: 'set-1' });
    await service.delete('set-1');
    expect(mockFindService.findById).toHaveBeenCalledWith('set-1', undefined);
    expect(mockRepo.softDelete).toHaveBeenCalledWith('set-1', undefined);
  });
});
