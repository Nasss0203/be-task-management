import { HttpStatus } from '@nestjs/common';
import { BoardViewType } from 'src/modules/boards/domain/entities/board.entity';
import { ROLE_PERMISSION_MAP } from 'src/modules/permission/constants/role-permission-map.constant';
import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { PlanTypeWorkspace } from '../domain/entities/workspace.entity';
import { CreateWorkspaceServiceImpl } from './create-workspace.service';

describe('CreateWorkspaceServiceImpl', () => {
  let service: CreateWorkspaceServiceImpl;

  const manager = {
    getRepository: jest.fn().mockReturnValue({
      create: jest.fn((data) => data),
    }),
    save: jest.fn(),
  };

  const workspaceRepo = {
    existsBySlug: jest.fn(),
    save: jest.fn(),
  };

  const createUserWorkspaceService = {
    create: jest.fn(),
  };

  const roleRepository = {
    saveMany: jest.fn(),
  };

  const uow = {
    runInTransaction: jest.fn((callback) => callback(manager)),
  };

  const createUserRoleService = {
    create: jest.fn(),
  };

  const createPageService = {
    createDefault: jest.fn(),
  };

  const createProjectService = {
    create: jest.fn(),
  };

  const updatePageBlockService = {
    update: jest.fn(),
  };

  const createBoardService = {
    create: jest.fn(),
  };

  const createTaskStatusService = {
    createMany: jest.fn(),
  };

  const createTaskPriorityService = {
    createMany: jest.fn(),
  };

  const createTaskService = {
    createMany: jest.fn(),
  };

  const findPermissionRepository = {
    findAll: jest.fn(),
  };

  const createRolePermissionService = {
    createMany: jest.fn(),
  };

  const checkWorkspaceLimitService = {
    applyBillingForNewWorkspace: jest.fn(),
  };

  const usageLimitEnforcerService = {
    syncProjectUsedValue: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();

    manager.getRepository.mockReturnValue({
      create: jest.fn((data) => data),
    });
    manager.save.mockResolvedValue(undefined);
    uow.runInTransaction.mockImplementation((callback) => callback(manager));

    service = new CreateWorkspaceServiceImpl(
      workspaceRepo as any,
      createUserWorkspaceService as any,
      roleRepository as any,
      uow as any,
      createUserRoleService as any,
      createPageService as any,
      createProjectService as any,
      updatePageBlockService as any,
      createBoardService as any,
      createTaskStatusService as any,
      createTaskPriorityService as any,
      createTaskService as any,
      findPermissionRepository as any,
      createRolePermissionService as any,
      checkWorkspaceLimitService as any,
      usageLimitEnforcerService as any,
    );
  });

  const buildPermissions = () => {
    const permissionCodes = new Set(Object.values(ROLE_PERMISSION_MAP).flat());

    return Array.from(permissionCodes).map((code, index) => ({
      id: `permission-${index + 1}`,
      code,
    }));
  };

  const mockRbacSeedSuccess = () => {
    roleRepository.saveMany.mockResolvedValue([
      { id: 'role-owner', name: RoleName.OWNER },
      { id: 'role-admin', name: RoleName.ADMIN },
      { id: 'role-member', name: RoleName.MEMBER },
      { id: 'role-viewer', name: RoleName.VIEWER },
    ]);

    findPermissionRepository.findAll.mockResolvedValue(buildPermissions());
  };

  it('creates default workspace successfully', async () => {
    const userId = 'user-123456';
    const workspace = {
      id: 'workspace-1',
      name: 'Task management',
      slug: 'task-management-user-123456',
      planType: PlanTypeWorkspace.FREE,
    };

    const createdPage = {
      id: 'page-1',
      pageBlock: { id: 'block-1' },
    };

    const project = {
      id: 'project-1',
      name: 'Task management project',
    };

    const board = {
      id: 'board-1',
    };

    workspaceRepo.existsBySlug.mockResolvedValue(false);
    workspaceRepo.save.mockResolvedValue(workspace);
    mockRbacSeedSuccess();

    createPageService.createDefault.mockResolvedValue(createdPage);
    createProjectService.create.mockResolvedValue(project);
    createBoardService.create.mockResolvedValue(board);

    createTaskStatusService.createMany.mockResolvedValue([
      { id: 'status-1', name: 'Todo' },
      { id: 'status-2', name: 'In Progress' },
      { id: 'status-3', name: 'Done' },
    ]);

    createTaskPriorityService.createMany.mockResolvedValue([
      { id: 'priority-1', name: 'Low' },
      { id: 'priority-2', name: 'Medium' },
      { id: 'priority-3', name: 'High' },
    ]);

    const result = await service.createDefault({ userId });

    expect(result).toBe(workspace);
    expect(uow.runInTransaction).toHaveBeenCalled();
    expect(workspaceRepo.existsBySlug).toHaveBeenCalled();
    expect(workspaceRepo.save).toHaveBeenCalled();
    expect(createUserWorkspaceService.create).toHaveBeenCalled();
    expect(roleRepository.saveMany).toHaveBeenCalled();
    expect(createRolePermissionService.createMany).toHaveBeenCalled();
    expect(createUserRoleService.create).toHaveBeenCalled();
    expect(createPageService.createDefault).toHaveBeenCalled();
    expect(checkWorkspaceLimitService.applyBillingForNewWorkspace).toHaveBeenCalledWith(userId, workspace.id, manager);
    expect(createProjectService.create).toHaveBeenCalled();
    expect(createBoardService.create).toHaveBeenCalled();
    expect(usageLimitEnforcerService.syncProjectUsedValue).toHaveBeenCalledWith(workspace.id, manager);
    expect(createTaskStatusService.createMany).toHaveBeenCalled();
    expect(createTaskPriorityService.createMany).toHaveBeenCalled();
    expect(createTaskService.createMany).not.toHaveBeenCalled();
    expect(updatePageBlockService.update).toHaveBeenCalled();
  });

  it('throws conflict exception if workspace slug already exists', async () => {
    const userId = 'user-123456';
    workspaceRepo.existsBySlug.mockResolvedValue(true);

    await expect(service.createDefault({ userId })).rejects.toMatchObject({
      status: HttpStatus.CONFLICT,
    });

    expect(workspaceRepo.existsBySlug).toHaveBeenCalled();
    expect(workspaceRepo.save).not.toHaveBeenCalled();
  });

  it('throws internal error when roles are not created correctly', async () => {
    const userId = 'user-123456';
    workspaceRepo.existsBySlug.mockResolvedValue(false);
    workspaceRepo.save.mockResolvedValue({ id: 'workspace-1', name: 'Test' });
    
    roleRepository.saveMany.mockResolvedValue([
      { id: 'role-admin', name: RoleName.ADMIN },
    ]);

    await expect(service.createDefault({ userId })).rejects.toMatchObject({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });

    expect(findPermissionRepository.findAll).not.toHaveBeenCalled();
  });

  it('throws internal error when permissions are not found', async () => {
    const userId = 'user-123456';
    workspaceRepo.existsBySlug.mockResolvedValue(false);
    workspaceRepo.save.mockResolvedValue({ id: 'workspace-1', name: 'Test' });
    
    roleRepository.saveMany.mockResolvedValue([
      { id: 'role-owner', name: RoleName.OWNER },
      { id: 'role-admin', name: RoleName.ADMIN },
      { id: 'role-member', name: RoleName.MEMBER },
      { id: 'role-viewer', name: RoleName.VIEWER },
    ]);

    findPermissionRepository.findAll.mockResolvedValue([]);

    await expect(service.createDefault({ userId })).rejects.toMatchObject({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  });

  it('throws internal error when a specific permission is not found in database map', async () => {
    const userId = 'user-123456';
    workspaceRepo.existsBySlug.mockResolvedValue(false);
    workspaceRepo.save.mockResolvedValue({ id: 'workspace-1', name: 'Test' });
    
    roleRepository.saveMany.mockResolvedValue([
      { id: 'role-owner', name: RoleName.OWNER },
      { id: 'role-admin', name: RoleName.ADMIN },
      { id: 'role-member', name: RoleName.MEMBER },
      { id: 'role-viewer', name: RoleName.VIEWER },
    ]);

    findPermissionRepository.findAll.mockResolvedValue([{ id: 'dummy-1', code: 'DUMMY_CODE' }]);

    await expect(service.createDefault({ userId })).rejects.toMatchObject({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  });



  it('does not update default page block if createdPage has no pageBlock', async () => {
    const userId = 'user-123456';
    const workspace = { id: 'workspace-1', name: 'Task management', slug: 'task-management', planType: PlanTypeWorkspace.FREE };
    
    workspaceRepo.existsBySlug.mockResolvedValue(false);
    workspaceRepo.save.mockResolvedValue(workspace);
    mockRbacSeedSuccess();

    createPageService.createDefault.mockResolvedValue({ id: 'page-1' }); // missing pageBlock
    createProjectService.create.mockResolvedValue({ id: 'project-1', name: 'Proj' });
    createBoardService.create.mockResolvedValue({ id: 'board-1' });

    createTaskStatusService.createMany.mockResolvedValue([
      { id: 'status-1', name: 'Todo' },
      { id: 'status-2', name: 'In Progress' },
      { id: 'status-3', name: 'Done' },
    ]);

    createTaskPriorityService.createMany.mockResolvedValue([
      { id: 'priority-1', name: 'Low' },
      { id: 'priority-2', name: 'Medium' },
      { id: 'priority-3', name: 'High' },
    ]);

    await service.createDefault({ userId });

    expect(updatePageBlockService.update).not.toHaveBeenCalled();
  });
});
