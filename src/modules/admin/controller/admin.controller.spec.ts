import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from '../admin.service';
import { ADMIN_TYPES } from '../interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';

describe('AdminController', () => {
  let controller: AdminController;

  const mockAdminFindAllWorkspaceApp = { findAllWorkspace: jest.fn() };
  const mockAdminWorkspaceOverviewApp = { getOverview: jest.fn() };
  const mockAdminWorkspaceMemberSummaryApp = { getMemberSummary: jest.fn() };
  const mockAdminUpdateWorkspacePlanApp = { updatePlan: jest.fn() };
  const mockAdminDashboardSummaryApp = { getSummary: jest.fn() };
  const mockAdminUserGrowthApp = { getUserGrowth: jest.fn() };
  const mockAdminWorkspaceGrowthApp = { getWorkspaceGrowth: jest.fn() };
  const mockAdminWorkspacePlanApp = { getWorkspacePlan: jest.fn() };
  const mockAdminRetentionMetricsApp = { getRetentionMetrics: jest.fn() };
  const mockAdminSystemHealthApp = { getSystemHealth: jest.fn() };
  const mockAdminRecentActivityApp = { getRecentActivities: jest.fn() };
  const mockAdminUserOverviewApp = { getOverview: jest.fn() };
  const mockAdminUserApp = { findAll: jest.fn(), lockUser: jest.fn(), unlockUser: jest.fn(), updateSystemRole: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: {} },
        { provide: ADMIN_TYPES.applications.AdminFindAllWorkspaceApplication, useValue: mockAdminFindAllWorkspaceApp },
        { provide: ADMIN_TYPES.applications.AdminWorkspaceOverviewApplication, useValue: mockAdminWorkspaceOverviewApp },
        { provide: WORKSPACE_TYPES.applications.AdminWorkspaceMemberSummaryApplication, useValue: mockAdminWorkspaceMemberSummaryApp },
        { provide: ADMIN_TYPES.applications.AdminUpdateWorkspacePlanApplication, useValue: mockAdminUpdateWorkspacePlanApp },
        { provide: ADMIN_TYPES.applications.AdminDashboardSummaryApplication, useValue: mockAdminDashboardSummaryApp },
        { provide: ADMIN_TYPES.applications.AdminUserGrowthApplication, useValue: mockAdminUserGrowthApp },
        { provide: ADMIN_TYPES.applications.AdminWorkspaceGrowthApplication, useValue: mockAdminWorkspaceGrowthApp },
        { provide: ADMIN_TYPES.applications.AdminWorkspacePlanApplication, useValue: mockAdminWorkspacePlanApp },
        { provide: ADMIN_TYPES.applications.AdminRetentionMetricsApplication, useValue: mockAdminRetentionMetricsApp },
        { provide: ADMIN_TYPES.applications.AdminSystemHealthApplication, useValue: mockAdminSystemHealthApp },
        { provide: ADMIN_TYPES.applications.AdminRecentActivityApplication, useValue: mockAdminRecentActivityApp },
        { provide: ADMIN_TYPES.applications.AdminUserOverviewApplication, useValue: mockAdminUserOverviewApp },
        { provide: ADMIN_TYPES.applications.AdminUserApplication, useValue: mockAdminUserApp },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should findAllWorkspace', async () => {
    const query = { page: 1, limit: 10 } as any;
    mockAdminFindAllWorkspaceApp.findAllWorkspace.mockResolvedValue({});
    expect(await controller.findAllWorkspace(query)).toEqual({});
    expect(mockAdminFindAllWorkspaceApp.findAllWorkspace).toHaveBeenCalledWith(query);
  });

  it('should getWorkspaceOverview', async () => {
    mockAdminWorkspaceOverviewApp.getOverview.mockResolvedValue({});
    expect(await controller.getWorkspaceOverview('1')).toEqual({});
    expect(mockAdminWorkspaceOverviewApp.getOverview).toHaveBeenCalledWith('1');
  });

  it('should getWorkspaceMemberSummary', async () => {
    mockAdminWorkspaceMemberSummaryApp.getMemberSummary.mockResolvedValue({});
    expect(await controller.getWorkspaceMemberSummary('1')).toEqual({});
    expect(mockAdminWorkspaceMemberSummaryApp.getMemberSummary).toHaveBeenCalledWith('1');
  });

  it('should updateWorkspacePlan', async () => {
    const dto = { planId: 'p1' } as any;
    mockAdminUpdateWorkspacePlanApp.updatePlan.mockResolvedValue({});
    expect(await controller.updateWorkspacePlan('1', dto)).toEqual({});
    expect(mockAdminUpdateWorkspacePlanApp.updatePlan).toHaveBeenCalledWith('1', dto);
  });

  it('should getDashboardSummary', async () => {
    mockAdminDashboardSummaryApp.getSummary.mockResolvedValue({});
    expect(await controller.getDashboardSummary()).toEqual({});
    expect(mockAdminDashboardSummaryApp.getSummary).toHaveBeenCalled();
  });

  it('should getUserGrowth', async () => {
    const query = { type: 'week' } as any;
    mockAdminUserGrowthApp.getUserGrowth.mockResolvedValue([]);
    expect(await controller.getUserGrowth(query)).toEqual([]);
    expect(mockAdminUserGrowthApp.getUserGrowth).toHaveBeenCalledWith(query);
  });

  it('should getWorkspaceGrowth', async () => {
    const query = { type: 'week' } as any;
    mockAdminWorkspaceGrowthApp.getWorkspaceGrowth.mockResolvedValue([]);
    expect(await controller.getWorkspaceGrowth(query)).toEqual([]);
    expect(mockAdminWorkspaceGrowthApp.getWorkspaceGrowth).toHaveBeenCalledWith(query);
  });

  it('should getWorkspacePlan', async () => {
    mockAdminWorkspacePlanApp.getWorkspacePlan.mockResolvedValue([]);
    expect(await controller.getWorkspacePlan()).toEqual([]);
    expect(mockAdminWorkspacePlanApp.getWorkspacePlan).toHaveBeenCalled();
  });

  it('should getRetentionMetrics', async () => {
    mockAdminRetentionMetricsApp.getRetentionMetrics.mockResolvedValue([]);
    expect(await controller.getRetentionMetrics()).toEqual([]);
    expect(mockAdminRetentionMetricsApp.getRetentionMetrics).toHaveBeenCalled();
  });

  it('should getSystemHealth', async () => {
    mockAdminSystemHealthApp.getSystemHealth.mockResolvedValue([]);
    expect(await controller.getSystemHealth()).toEqual([]);
    expect(mockAdminSystemHealthApp.getSystemHealth).toHaveBeenCalled();
  });

  it('should getRecentActivities', async () => {
    mockAdminRecentActivityApp.getRecentActivities.mockResolvedValue([]);
    expect(await controller.getRecentActivities()).toEqual([]);
    expect(mockAdminRecentActivityApp.getRecentActivities).toHaveBeenCalled();
  });

  it('should getUserOverview', async () => {
    mockAdminUserOverviewApp.getOverview.mockResolvedValue({});
    expect(await controller.getUserOverview()).toEqual({});
    expect(mockAdminUserOverviewApp.getOverview).toHaveBeenCalled();
  });

  it('should findAllUsers', async () => {
    const query = {} as any;
    mockAdminUserApp.findAll.mockResolvedValue([]);
    expect(await controller.findAllUsers(query)).toEqual([]);
    expect(mockAdminUserApp.findAll).toHaveBeenCalledWith(query);
  });

  it('should lockUser', async () => {
    const auth = { id: 'auth-id', systemRole: SystemRole.SUPER_ADMIN } as any;
    mockAdminUserApp.lockUser.mockResolvedValue(undefined);
    expect(await controller.lockUser('1', auth)).toBeUndefined();
    expect(mockAdminUserApp.lockUser).toHaveBeenCalledWith('1', auth.id, auth.systemRole);
  });

  it('should unlockUser', async () => {
    const auth = { id: 'auth-id', systemRole: SystemRole.SUPER_ADMIN } as any;
    mockAdminUserApp.unlockUser.mockResolvedValue(undefined);
    expect(await controller.unlockUser('1', auth)).toBeUndefined();
    expect(mockAdminUserApp.unlockUser).toHaveBeenCalledWith('1', auth.id, auth.systemRole);
  });

  it('should updateUserSystemRole', async () => {
    const auth = { id: 'auth-id', systemRole: SystemRole.SUPER_ADMIN } as any;
    const dto = { role: SystemRole.USER } as any;
    mockAdminUserApp.updateSystemRole.mockResolvedValue(undefined);
    expect(await controller.updateUserSystemRole('1', dto, auth)).toBeUndefined();
    expect(mockAdminUserApp.updateSystemRole).toHaveBeenCalledWith('1', dto, auth.id, auth.systemRole);
  });
});
