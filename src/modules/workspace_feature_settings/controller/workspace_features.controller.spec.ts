import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceFeaturesController } from './workspace_features.controller';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';

describe('WorkspaceFeaturesController', () => {
  let controller: WorkspaceFeaturesController;

  const mockApp = {
    findWorkspaceFeatures: jest.fn(),
    updateWorkspaceFeature: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspaceFeaturesController],
      providers: [
        {
          provide:
            WORKSPACE_FEATURE_SETTING_TYPES.applications
              .WorkspaceFeatureAccessApplication,
          useValue: mockApp,
        },
      ],
    }).compile();

    controller = module.get<WorkspaceFeaturesController>(
      WorkspaceFeaturesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should find workspace features', async () => {
    mockApp.findWorkspaceFeatures.mockResolvedValue([{ id: 'wf-1' }]);
    const result = await controller.findWorkspaceFeatures('ws-1');
    expect(mockApp.findWorkspaceFeatures).toHaveBeenCalledWith('ws-1');
    expect(result).toEqual([{ id: 'wf-1' }]);
  });

  it('should update workspace feature', async () => {
    mockApp.updateWorkspaceFeature.mockResolvedValue({ id: 'wf-1' });
    const result = await controller.updateWorkspaceFeature(
      'ws-1',
      'feat-1',
      { enabled: true },
      { id: 'u-1' } as any,
    );
    expect(mockApp.updateWorkspaceFeature).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      featureCode: 'feat-1',
      dto: { enabled: true },
      userId: 'u-1',
    });
    expect(result).toEqual({ id: 'wf-1' });
  });
});
