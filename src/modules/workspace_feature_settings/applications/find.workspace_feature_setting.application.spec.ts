import { Test, TestingModule } from '@nestjs/testing';
import { FindWorkspaceFeatureSettingApplicationImpl } from './find.workspace_feature_setting.application';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';
import { WorkspaceFeatureSettingMapper } from '../mapper/workspace_feature_setting.mapper';

describe('FindWorkspaceFeatureSettingApplicationImpl', () => {
  let app: FindWorkspaceFeatureSettingApplicationImpl;

  const mockService = {
    findAll: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindWorkspaceFeatureSettingApplicationImpl,
        {
          provide:
            WORKSPACE_FEATURE_SETTING_TYPES.services
              .FindWorkspaceFeatureSettingService,
          useValue: mockService,
        },
      ],
    }).compile();

    app = module.get<FindWorkspaceFeatureSettingApplicationImpl>(
      FindWorkspaceFeatureSettingApplicationImpl,
    );
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should find all', async () => {
    mockService.findAll.mockResolvedValue([{ id: 'set-1' }]);
    jest
      .spyOn(WorkspaceFeatureSettingMapper, 'toResponse')
      .mockReturnValue({ id: 'set-1' } as any);

    const result = await app.findAll();
    expect(mockService.findAll).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'set-1' }]);
  });

  it('should find by id', async () => {
    mockService.findById.mockResolvedValue({ id: 'set-1' });
    jest
      .spyOn(WorkspaceFeatureSettingMapper, 'toResponse')
      .mockReturnValue({ id: 'set-1' } as any);

    const result = await app.findById('set-1');
    expect(mockService.findById).toHaveBeenCalledWith('set-1');
    expect(result).toEqual({ id: 'set-1' });
  });
});
