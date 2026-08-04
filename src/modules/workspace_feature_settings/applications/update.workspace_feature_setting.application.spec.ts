import { Test, TestingModule } from '@nestjs/testing';
import { UpdateWorkspaceFeatureSettingApplicationImpl } from './update.workspace_feature_setting.application';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';
import { WorkspaceFeatureSettingMapper } from '../mapper/workspace_feature_setting.mapper';

describe('UpdateWorkspaceFeatureSettingApplicationImpl', () => {
  let app: UpdateWorkspaceFeatureSettingApplicationImpl;

  const mockService = {
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateWorkspaceFeatureSettingApplicationImpl,
        {
          provide:
            WORKSPACE_FEATURE_SETTING_TYPES.services
              .UpdateWorkspaceFeatureSettingService,
          useValue: mockService,
        },
      ],
    }).compile();

    app = module.get<UpdateWorkspaceFeatureSettingApplicationImpl>(
      UpdateWorkspaceFeatureSettingApplicationImpl,
    );
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should update setting', async () => {
    mockService.update.mockResolvedValue({ id: 'set-1' });
    jest
      .spyOn(WorkspaceFeatureSettingMapper, 'toResponse')
      .mockReturnValue({ id: 'set-1' } as any);

    const result = await app.update('set-1', { is_enabled: true } as any);
    expect(mockService.update).toHaveBeenCalledWith('set-1', {
      is_enabled: true,
    });
    expect(result).toEqual({ id: 'set-1' });
  });
});
