import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceUsageLimitsController } from './workspace-usage-limits.controller';
import { BILLING_TYPES } from '../interfaces/types';

describe('WorkspaceUsageLimitsController', () => {
  let controller: WorkspaceUsageLimitsController;

  const mockQueryApp = {
    getWorkspaceUsageLimits: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspaceUsageLimitsController],
      providers: [
        {
          provide: BILLING_TYPES.applications.BillingQueryApplication,
          useValue: mockQueryApp,
        },
      ],
    }).compile();

    controller = module.get<WorkspaceUsageLimitsController>(
      WorkspaceUsageLimitsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get workspace usage limits', async () => {
    mockQueryApp.getWorkspaceUsageLimits.mockResolvedValue([{ id: 'limit-1' }]);
    const req = { user: { sub: 'u-1' } } as any;
    const result = await controller.getWorkspaceUsageLimits('ws-1', req);
    expect(mockQueryApp.getWorkspaceUsageLimits).toHaveBeenCalledWith(
      'u-1',
      'ws-1',
    );
    expect(result).toEqual([{ id: 'limit-1' }]);
  });

  it('should throw if user id is missing', async () => {
    const req = { user: {} } as any;
    await expect(
      controller.getWorkspaceUsageLimits('ws-1', req),
    ).rejects.toThrow('User id not found');
  });
});
