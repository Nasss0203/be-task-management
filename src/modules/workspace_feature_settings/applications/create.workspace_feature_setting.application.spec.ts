import { Test, TestingModule } from '@nestjs/testing';
import { CreateWorkspaceFeatureSettingApplicationImpl } from './create.workspace_feature_setting.application';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';
import { WorkspaceFeatureSettingMapper } from '../mapper/workspace_feature_setting.mapper';

describe('CreateWorkspaceFeatureSettingApplicationImpl', () => {
  let app: CreateWorkspaceFeatureSettingApplicationImpl;

  const mockService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateWorkspaceFeatureSettingApplicationImpl,
        { provide: WORKSPACE_FEATURE_SETTING_TYPES.services.CreateWorkspaceFeatureSettingService, useValue: mockService },
      ],
    }).compile();

    app = module.get<CreateWorkspaceFeatureSettingApplicationImpl>(CreateWorkspaceFeatureSettingApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should create setting', async () => {
    mockService.create.mockResolvedValue({ id: 'set-1' });
    jest.spyOn(WorkspaceFeatureSettingMapper, 'toResponse').mockReturnValue({ id: 'set-1' } as any);

    const result = await app.create({ workspace_id: 'ws-1' } as any);
    expect(mockService.create).toHaveBeenCalledWith({ workspace_id: 'ws-1' });
    expect(result).toEqual({ id: 'set-1' });
  });
});
