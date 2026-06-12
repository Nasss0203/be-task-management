import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceFeatureSettingsController } from './workspace_feature_settings.controller';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';

describe('WorkspaceFeatureSettingsController', () => {
  let controller: WorkspaceFeatureSettingsController;

  const mockCreateApp = { create: jest.fn() };
  const mockFindApp = { findAll: jest.fn(), findById: jest.fn() };
  const mockUpdateApp = { update: jest.fn() };
  const mockDeleteApp = { delete: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspaceFeatureSettingsController],
      providers: [
        { provide: WORKSPACE_FEATURE_SETTING_TYPES.applications.CreateWorkspaceFeatureSettingApplication, useValue: mockCreateApp },
        { provide: WORKSPACE_FEATURE_SETTING_TYPES.applications.FindWorkspaceFeatureSettingApplication, useValue: mockFindApp },
        { provide: WORKSPACE_FEATURE_SETTING_TYPES.applications.UpdateWorkspaceFeatureSettingApplication, useValue: mockUpdateApp },
        { provide: WORKSPACE_FEATURE_SETTING_TYPES.applications.DeleteWorkspaceFeatureSettingApplication, useValue: mockDeleteApp },
      ],
    }).compile();

    controller = module.get<WorkspaceFeatureSettingsController>(WorkspaceFeatureSettingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create setting', async () => {
    mockCreateApp.create.mockResolvedValue({ id: 'set-1' });
    const result = await controller.create({ is_enabled: true } as any);
    expect(mockCreateApp.create).toHaveBeenCalledWith({ is_enabled: true });
    expect(result).toEqual({ id: 'set-1' });
  });

  it('should find all', async () => {
    mockFindApp.findAll.mockResolvedValue([{ id: 'set-1' }]);
    const result = await controller.findAll();
    expect(mockFindApp.findAll).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'set-1' }]);
  });

  it('should find one', async () => {
    mockFindApp.findById.mockResolvedValue({ id: 'set-1' });
    const result = await controller.findOne('set-1');
    expect(mockFindApp.findById).toHaveBeenCalledWith('set-1');
    expect(result).toEqual({ id: 'set-1' });
  });

  it('should update setting', async () => {
    mockUpdateApp.update.mockResolvedValue({ id: 'set-1' });
    const result = await controller.update('set-1', { is_enabled: false } as any);
    expect(mockUpdateApp.update).toHaveBeenCalledWith('set-1', { is_enabled: false });
    expect(result).toEqual({ id: 'set-1' });
  });

  it('should remove setting', async () => {
    const result = await controller.remove('set-1');
    expect(mockDeleteApp.delete).toHaveBeenCalledWith('set-1');
    expect(result).toEqual({ success: true });
  });
});
