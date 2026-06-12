import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceFeatureAccessApplicationImpl } from './workspace_feature_access.application';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';
import { WorkspaceFeatureStatusMapper } from '../mapper/workspace_feature_status.mapper';

describe('WorkspaceFeatureAccessApplicationImpl', () => {
  let app: WorkspaceFeatureAccessApplicationImpl;

  const mockService = {
    findWorkspaceFeatures: jest.fn(),
    updateWorkspaceFeature: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceFeatureAccessApplicationImpl,
        { provide: WORKSPACE_FEATURE_SETTING_TYPES.services.WorkspaceFeatureAccessService, useValue: mockService },
      ],
    }).compile();

    app = module.get<WorkspaceFeatureAccessApplicationImpl>(WorkspaceFeatureAccessApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should find workspace features', async () => {
    mockService.findWorkspaceFeatures.mockResolvedValue([{ id: 'wf-1' }]);
    jest.spyOn(WorkspaceFeatureStatusMapper, 'toResponse').mockReturnValue({ id: 'wf-1' } as any);

    const result = await app.findWorkspaceFeatures('ws-1');
    expect(mockService.findWorkspaceFeatures).toHaveBeenCalledWith('ws-1');
    expect(result).toEqual([{ id: 'wf-1' }]);
  });

  it('should update workspace feature', async () => {
    mockService.updateWorkspaceFeature.mockResolvedValue({ id: 'wf-1' });
    jest.spyOn(WorkspaceFeatureStatusMapper, 'toResponse').mockReturnValue({ id: 'wf-1' } as any);

    const result = await app.updateWorkspaceFeature({
      workspaceId: 'ws-1',
      featureCode: 'feat-1',
      dto: { enabled: true },
      userId: 'u-1',
    });
    expect(mockService.updateWorkspaceFeature).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      featureCode: 'feat-1',
      enabled: true,
      userId: 'u-1',
    });
    expect(result).toEqual({ id: 'wf-1' });
  });
});
