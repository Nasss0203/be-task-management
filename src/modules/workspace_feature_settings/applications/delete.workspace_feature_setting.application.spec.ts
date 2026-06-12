import { Test, TestingModule } from '@nestjs/testing';
import { DeleteWorkspaceFeatureSettingApplicationImpl } from './delete.workspace_feature_setting.application';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';

describe('DeleteWorkspaceFeatureSettingApplicationImpl', () => {
  let app: DeleteWorkspaceFeatureSettingApplicationImpl;

  const mockService = {
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteWorkspaceFeatureSettingApplicationImpl,
        { provide: WORKSPACE_FEATURE_SETTING_TYPES.services.DeleteWorkspaceFeatureSettingService, useValue: mockService },
      ],
    }).compile();

    app = module.get<DeleteWorkspaceFeatureSettingApplicationImpl>(DeleteWorkspaceFeatureSettingApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should delete setting', async () => {
    await app.delete('set-1');
    expect(mockService.delete).toHaveBeenCalledWith('set-1');
  });
});
