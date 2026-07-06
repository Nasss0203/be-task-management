import { HttpStatus } from '@nestjs/common';
import { BoardViewType } from 'src/modules/boards/domain/entities/board.entity';
import { ROLE_PERMISSION_MAP } from 'src/modules/permission/constants/role-permission-map.constant';
import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { PlanTypeWorkspace } from '../domain/entities/workspace.entity';
import { WorkspaceTemplateType } from '../types/types';
import { CreateWorkspaceTemplateServiceImpl } from './create-workspace-template.service';

describe('CreateWorkspaceTemplateServiceImpl', () => {
  let service: CreateWorkspaceTemplateServiceImpl;

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
    create: jest.fn(),
  };

  const createProjectService = {
    create: jest.fn(),
  };

  const createBoardService = {
    create: jest.fn(),
  };

  const createTaskStatusService = {
    create: jest.fn(),
  };

  const createTaskPriorityService = {
    create: jest.fn(),
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

  const createPageBlockService = {
    create: jest.fn(),
  };

  const checkWorkspaceLimitService = {
    checkCanCreateWorkspace: jest.fn(),
    applyBillingForNewWorkspace: jest.fn(),
  };

  const workspaceTemplatesService = {
    findOne: jest.fn(),
    findOneAvailableForUser: jest.fn().mockResolvedValue({ config: { projects: [], boards: [], pages: [], taskStatuses: [], taskPriorities: [], statuses: [], priorities: [], tasks: [] } }),
  };

  const pageTemplateBlocksService = {
    findByTemplateId: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    workspaceTemplatesService.findOneAvailableForUser.mockResolvedValue({ config: { projects: [], boards: [], pages: [], taskStatuses: [], taskPriorities: [], statuses: [], priorities: [], tasks: [] } });

    manager.getRepository.mockReturnValue({
      create: jest.fn((data) => data),
    });
    manager.save.mockResolvedValue(undefined);
    uow.runInTransaction.mockImplementation((callback) => callback(manager));

    service = new CreateWorkspaceTemplateServiceImpl(
      workspaceRepo as any,
      createUserWorkspaceService as any,
      roleRepository as any,
      uow as any,
      createUserRoleService as any,
      createPageService as any,
      createProjectService as any,
      createBoardService as any,
      createTaskStatusService as any,
      createTaskPriorityService as any,
      createTaskService as any,
      findPermissionRepository as any,
      createRolePermissionService as any,
      createPageBlockService as any,
      checkWorkspaceLimitService as any,
      workspaceTemplatesService as any,
      pageTemplateBlocksService as any,
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

  const mockWorkspaceCoreSuccess = () => {
    const workspace = {
      id: 'workspace-1',
      name: 'My Workspace',
      slug: 'my-workspace-user-123456',
      planType: PlanTypeWorkspace.FREE,
    };

    workspaceRepo.existsBySlug.mockResolvedValue(false);
    workspaceRepo.save.mockResolvedValue(workspace);
    mockRbacSeedSuccess();

    return workspace;
  };

  it('creates workspace from template successfully', async () => {
    const userId = 'user-123456';
    const workspace = {
      id: 'workspace-1',
      name: 'My Workspace',
      slug: 'my-workspace-user-123456',
      planType: PlanTypeWorkspace.FREE,
    };

    const page = {
      id: 'page-1',
    };

    const project = {
      id: 'project-1',
    };

    const board = {
      id: 'board-1',
      workspaceId: workspace.id,
      projectId: project.id,
      viewType: BoardViewType.BOARD,
    };

    workspaceTemplatesService.findOneAvailableForUser.mockResolvedValue({
      id: 'template-1',
      pageTemplateId: null,
      config: {
        projects: [
          {
            templateKey: 'main',
            name: 'My Workspace',
            key: 'TASK',
          },
        ],
        boards: [
          {
            templateKey: 'main-board',
            projectTemplateKey: 'main',
            name: 'Main Board',
            viewType: BoardViewType.BOARD,
          },
        ],
        pageBlocks: [],
        statuses: [],
        priorities: [],
        tasks: [],
      },
    });

    workspaceRepo.existsBySlug.mockResolvedValue(false);
    workspaceRepo.save.mockResolvedValue(workspace);
    mockRbacSeedSuccess();

    createPageService.create.mockResolvedValue(page);
    createProjectService.create.mockResolvedValue(project);
    createBoardService.create.mockResolvedValue(board);

    const result = await service.create(userId, {
      name: 'My Workspace',
      templateId: 'template-1',
    });

    expect(result).toBe(workspace);

    expect(uow.runInTransaction).toHaveBeenCalled();
    expect(
      checkWorkspaceLimitService.checkCanCreateWorkspace,
    ).toHaveBeenCalledWith(userId, manager);
    expect(workspaceTemplatesService.findOneAvailableForUser).toHaveBeenCalledWith(
      'template-1',
      userId,
    );
    expect(workspaceRepo.save).toHaveBeenCalled();
    expect(createUserWorkspaceService.create).toHaveBeenCalled();
    expect(roleRepository.saveMany).toHaveBeenCalled();
    expect(createRolePermissionService.createMany).toHaveBeenCalled();
    expect(createUserRoleService.create).toHaveBeenCalledWith(
      {
        user_id: userId,
        role_id: 'role-owner',
        workspace_id: workspace.id,
        assigned_by: userId,
      },
      manager,
    );
    expect(
      checkWorkspaceLimitService.applyBillingForNewWorkspace,
    ).toHaveBeenCalledWith(userId, workspace.id, manager);
    expect(createPageService.create).toHaveBeenCalled();
    expect(createProjectService.create).toHaveBeenCalled();
    expect(createBoardService.create).toHaveBeenCalled();
  });

  it('throws conflict when workspace slug already exists', async () => {
    const userId = 'user-123456';

    workspaceTemplatesService.findOneAvailableForUser.mockResolvedValue({
      id: 'template-1',
      pageTemplateId: null,
      config: {
        projects: [],
        boards: [],
        pageBlocks: [],
        statuses: [],
        priorities: [],
        tasks: [],
      },
    });

    workspaceRepo.existsBySlug.mockResolvedValue(true);

    await expect(
      service.create(userId, {
        name: 'My Workspace',
        templateId: 'template-1',
      }),
    ).rejects.toMatchObject({
      status: HttpStatus.CONFLICT,
    });

    expect(workspaceRepo.existsBySlug).toHaveBeenCalled();
    expect(workspaceRepo.save).not.toHaveBeenCalled();
    expect(createUserWorkspaceService.create).not.toHaveBeenCalled();
    expect(roleRepository.saveMany).not.toHaveBeenCalled();
  });

  it('uses default template config when templateId is not provided', async () => {
    const userId = 'user-123456';
    const workspace = mockWorkspaceCoreSuccess();

    createPageService.create.mockResolvedValue({ id: 'page-1' });
    createProjectService.create.mockResolvedValue({ id: 'project-1' });
    createBoardService.create
      .mockResolvedValueOnce({
        id: 'board-1',
        workspaceId: workspace.id,
        projectId: 'project-1',
        viewType: BoardViewType.BOARD,
      })
      .mockResolvedValueOnce({
        id: 'board-2',
        workspaceId: workspace.id,
        projectId: 'project-1',
        viewType: BoardViewType.CALENDAR,
      });
    createTaskStatusService.create
      .mockResolvedValueOnce({ id: 'status-todo' })
      .mockResolvedValueOnce({ id: 'status-in-progress' })
      .mockResolvedValueOnce({ id: 'status-done' });
    createTaskPriorityService.create
      .mockResolvedValueOnce({ id: 'priority-low' })
      .mockResolvedValueOnce({ id: 'priority-medium' })
      .mockResolvedValueOnce({ id: 'priority-high' });

    const result = await service.create(userId, {
      name: 'My Workspace',
    });

    expect(result).toBe(workspace);
    expect(workspaceTemplatesService.findOne).not.toHaveBeenCalled();
    expect(createProjectService.create).not.toHaveBeenCalled();
    expect(createBoardService.create).not.toHaveBeenCalled();
    expect(createTaskStatusService.create).not.toHaveBeenCalled();
    expect(createTaskPriorityService.create).not.toHaveBeenCalled();
    expect(createTaskService.createMany).not.toHaveBeenCalled();
  });

  it('stops when workspace limit check fails', async () => {
    const userId = 'user-123456';
    const error = new Error('Workspace limit exceeded');

    checkWorkspaceLimitService.checkCanCreateWorkspace.mockRejectedValue(error);

    await expect(
      service.create(userId, {
        name: 'My Workspace',
        templateId: 'template-1',
      }),
    ).rejects.toBe(error);

    expect(workspaceTemplatesService.findOne).not.toHaveBeenCalled();
    expect(workspaceRepo.save).not.toHaveBeenCalled();
  });

  it('throws internal error when permissions are missing during RBAC seed', async () => {
    const userId = 'user-123456';

    workspaceTemplatesService.findOneAvailableForUser.mockResolvedValue({
      id: 'template-1',
      pageTemplateId: null,
      config: {
        projects: [],
        boards: [],
        pageBlocks: [],
        statuses: [],
        priorities: [],
        tasks: [],
      },
    });
    workspaceRepo.existsBySlug.mockResolvedValue(false);
    workspaceRepo.save.mockResolvedValue({
      id: 'workspace-1',
      name: 'My Workspace',
      slug: 'my-workspace',
      planType: PlanTypeWorkspace.FREE,
    });
    roleRepository.saveMany.mockResolvedValue([
      { id: 'role-owner', name: RoleName.OWNER },
      { id: 'role-admin', name: RoleName.ADMIN },
      { id: 'role-member', name: RoleName.MEMBER },
      { id: 'role-viewer', name: RoleName.VIEWER },
    ]);
    findPermissionRepository.findAll.mockResolvedValue([]);

    await expect(
      service.create(userId, {
        name: 'My Workspace',
        templateId: 'template-1',
      }),
    ).rejects.toMatchObject({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });

    expect(createRolePermissionService.createMany).not.toHaveBeenCalled();
    expect(createUserRoleService.create).not.toHaveBeenCalled();
  });

  it('throws internal error when owner role is not created', async () => {
    const userId = 'user-123456';

    workspaceTemplatesService.findOneAvailableForUser.mockResolvedValue({
      id: 'template-1',
      pageTemplateId: null,
      config: {
        projects: [],
        boards: [],
        pageBlocks: [],
        statuses: [],
        priorities: [],
        tasks: [],
      },
    });
    workspaceRepo.existsBySlug.mockResolvedValue(false);
    workspaceRepo.save.mockResolvedValue({
      id: 'workspace-1',
      name: 'My Workspace',
      slug: 'my-workspace',
      planType: PlanTypeWorkspace.FREE,
    });
    roleRepository.saveMany.mockResolvedValue([
      { id: 'role-admin', name: RoleName.ADMIN },
      { id: 'role-member', name: RoleName.MEMBER },
      { id: 'role-viewer', name: RoleName.VIEWER },
    ]);

    await expect(
      service.create(userId, {
        name: 'My Workspace',
        templateId: 'template-1',
      }),
    ).rejects.toMatchObject({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });

    expect(findPermissionRepository.findAll).not.toHaveBeenCalled();
    expect(createUserRoleService.create).not.toHaveBeenCalled();
  });

  it('throws bad request when board references missing project template key', async () => {
    const userId = 'user-123456';

    workspaceTemplatesService.findOneAvailableForUser.mockResolvedValue({
      id: 'template-1',
      pageTemplateId: null,
      config: {
        projects: [],
        boards: [
          {
            templateKey: 'main-board',
            projectTemplateKey: 'missing-project',
            name: 'Main Board',
            viewType: BoardViewType.BOARD,
          },
        ],
        pageBlocks: [],
        statuses: [],
        priorities: [],
        tasks: [],
      },
    });
    mockWorkspaceCoreSuccess();
    createPageService.create.mockResolvedValue({ id: 'page-1' });

    await expect(
      service.create(userId, {
        name: 'My Workspace',
        templateId: 'template-1',
      }),
    ).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
    });

    expect(createBoardService.create).not.toHaveBeenCalled();
  });

  it('throws bad request when task references missing status', async () => {
    const userId = 'user-123456';

    workspaceTemplatesService.findOneAvailableForUser.mockResolvedValue({
      id: 'template-1',
      pageTemplateId: null,
      config: {
        projects: [
          {
            templateKey: 'main',
            name: 'My Workspace',
            key: 'TASK',
          },
        ],
        boards: [],
        pageBlocks: [],
        statuses: [],
        priorities: [],
        tasks: [
          {
            projectTemplateKey: 'main',
            title: 'First task',
            statusName: 'Todo',
          },
        ],
      },
    });
    mockWorkspaceCoreSuccess();
    createPageService.create.mockResolvedValue({ id: 'page-1' });
    createProjectService.create.mockResolvedValue({ id: 'project-1' });

    await expect(
      service.create(userId, {
        name: 'My Workspace',
        templateId: 'template-1',
      }),
    ).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
    });

    expect(createTaskService.createMany).not.toHaveBeenCalled();
  });
  it('creates workspace from template with pageTemplateId and processes dbBlocks successfully', async () => {
    const userId = 'user-123456';
    const workspace = mockWorkspaceCoreSuccess();

    createPageService.create.mockResolvedValue({ id: 'page-1' });
    createProjectService.create.mockResolvedValue({ id: 'project-1' });
    createBoardService.create.mockResolvedValue({
      id: 'board-1',
      workspaceId: workspace.id,
      projectId: 'project-1',
      viewType: BoardViewType.BOARD,
    });

    workspaceTemplatesService.findOneAvailableForUser.mockResolvedValue({
      id: 'template-1',
      pageTemplateId: 'page-template-1',
      config: {
        projects: [
          {
            templateKey: 'main',
            name: 'My Workspace',
            key: 'TASK',
          },
        ],
        boards: [
          {
            templateKey: 'main-board',
            projectTemplateKey: 'main',
            name: 'Main Board',
            viewType: BoardViewType.BOARD,
          },
        ],
        pageBlocks: [],
        statuses: [],
        priorities: [],
        tasks: [],
      },
    });

    pageTemplateBlocksService.findByTemplateId.mockResolvedValue([
      { type: 'HEADING_1', orderIndex: 1, content: { title: 'H1' } },
      { type: 'HEADING_2', orderIndex: 2, content: { title: 'H2' } },
      { type: 'HEADING_3', orderIndex: 3, content: { title: 'H3' } },
      { type: 'PARAGRAPH', orderIndex: 4, content: { title: 'P' } },
      { type: 'DATABASE_VIEW', orderIndex: 5, content: { title: 'DB', boardTemplateKey: 'main-board' } },
    ]);

    await service.create(userId, {
      name: 'My Workspace',
      templateId: 'template-1',
    });

    expect(pageTemplateBlocksService.findByTemplateId).toHaveBeenCalledWith('page-template-1');
    expect(manager.getRepository).toHaveBeenCalled();
    expect(manager.save).toHaveBeenCalled();
  });

  it('throws bad request when page template block has database view but missing board template key', async () => {
    const userId = 'user-123456';
    mockWorkspaceCoreSuccess();

    createPageService.create.mockResolvedValue({ id: 'page-1' });
    createProjectService.create.mockResolvedValue({ id: 'project-1' });
    
    workspaceTemplatesService.findOneAvailableForUser.mockResolvedValue({
      id: 'template-1',
      pageTemplateId: 'page-template-1',
      config: {
        projects: [{ templateKey: 'main', name: 'My Workspace', key: 'TASK' }],
        boards: [],
        pageBlocks: [],
        statuses: [],
        priorities: [],
        tasks: [],
      },
    });

    pageTemplateBlocksService.findByTemplateId.mockResolvedValue([
      { type: 'DATABASE_VIEW', orderIndex: 1, content: { title: 'DB', boardTemplateKey: 'missing-board' } },
    ]);

    await expect(
      service.create(userId, { name: 'My Workspace', templateId: 'template-1' })
    ).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
    });
  });

  it('throws bad request when fallback page block has missing board template key', async () => {
    const userId = 'user-123456';
    mockWorkspaceCoreSuccess();

    createPageService.create.mockResolvedValue({ id: 'page-1' });
    createProjectService.create.mockResolvedValue({ id: 'project-1' });

    workspaceTemplatesService.findOneAvailableForUser.mockResolvedValue({
      id: 'template-1',
      pageTemplateId: null,
      config: {
        projects: [{ templateKey: 'main', name: 'My Workspace', key: 'TASK' }],
        boards: [],
        pageBlocks: [
          {
            templateKey: 'main-block',
            boardTemplateKey: 'missing-board',
            title: 'My Board',
          }
        ],
        statuses: [],
        priorities: [],
        tasks: [],
      },
    });

    await expect(
      service.create(userId, { name: 'My Workspace', templateId: 'template-1' })
    ).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
    });
  });

  it('throws bad request when status references missing project template key', async () => {
    const userId = 'user-123456';
    mockWorkspaceCoreSuccess();

    createPageService.create.mockResolvedValue({ id: 'page-1' });
    createProjectService.create.mockResolvedValue({ id: 'project-1' });

    workspaceTemplatesService.findOneAvailableForUser.mockResolvedValue({
      id: 'template-1',
      pageTemplateId: null,
      config: {
        projects: [],
        boards: [],
        pageBlocks: [],
        statuses: [
          {
            projectTemplateKey: 'missing-project',
            name: 'Todo',
          }
        ],
        priorities: [],
        tasks: [],
      },
    });

    await expect(
      service.create(userId, { name: 'My Workspace', templateId: 'template-1' })
    ).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
    });
  });

  it('throws bad request when priority references missing project template key', async () => {
    const userId = 'user-123456';
    mockWorkspaceCoreSuccess();

    createPageService.create.mockResolvedValue({ id: 'page-1' });
    createProjectService.create.mockResolvedValue({ id: 'project-1' });

    workspaceTemplatesService.findOneAvailableForUser.mockResolvedValue({
      id: 'template-1',
      pageTemplateId: null,
      config: {
        projects: [],
        boards: [],
        pageBlocks: [],
        statuses: [],
        priorities: [
          {
            projectTemplateKey: 'missing-project',
            name: 'High',
          }
        ],
        tasks: [],
      },
    });

    await expect(
      service.create(userId, { name: 'My Workspace', templateId: 'template-1' })
    ).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
    });
  });

  it('throws bad request when task references missing project template key', async () => {
    const userId = 'user-123456';
    mockWorkspaceCoreSuccess();

    createPageService.create.mockResolvedValue({ id: 'page-1' });
    createProjectService.create.mockResolvedValue({ id: 'project-1' });
    createTaskStatusService.create.mockResolvedValue({ id: 'status-todo' });

    workspaceTemplatesService.findOneAvailableForUser.mockResolvedValue({
      id: 'template-1',
      pageTemplateId: null,
      config: {
        projects: [{ templateKey: 'main', name: 'My Workspace', key: 'TASK' }],
        boards: [],
        pageBlocks: [],
        statuses: [{ projectTemplateKey: 'main', name: 'Todo' }],
        priorities: [],
        tasks: [
          {
            projectTemplateKey: 'missing-project',
            title: 'First task',
            statusName: 'Todo',
          }
        ],
      },
    });

    await expect(
      service.create(userId, { name: 'My Workspace', templateId: 'template-1' })
    ).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
    });
  });

  it('throws bad request when task references missing priority', async () => {
    const userId = 'user-123456';
    mockWorkspaceCoreSuccess();

    createPageService.create.mockResolvedValue({ id: 'page-1' });
    createProjectService.create.mockResolvedValue({ id: 'project-1' });
    createTaskStatusService.create.mockResolvedValue({ id: 'status-todo' });

    workspaceTemplatesService.findOneAvailableForUser.mockResolvedValue({
      id: 'template-1',
      pageTemplateId: null,
      config: {
        projects: [{ templateKey: 'main', name: 'My Workspace', key: 'TASK' }],
        boards: [],
        pageBlocks: [],
        statuses: [{ projectTemplateKey: 'main', name: 'Todo' }],
        priorities: [],
        tasks: [
          {
            projectTemplateKey: 'main',
            title: 'First task',
            statusName: 'Todo',
            priorityName: 'missing-priority',
          }
        ],
      },
    });

    await expect(
      service.create(userId, { name: 'My Workspace', templateId: 'template-1' })
    ).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
    });
  });
  it('throws internal error when a specific permission is not found in database', async () => {
    const userId = 'user-123456';

    workspaceTemplatesService.findOneAvailableForUser.mockResolvedValue({
      id: 'template-1',
      pageTemplateId: null,
      config: {
        projects: [], boards: [], pageBlocks: [], statuses: [], priorities: [], tasks: [],
      },
    });
    workspaceRepo.existsBySlug.mockResolvedValue(false);
    workspaceRepo.save.mockResolvedValue({
      id: 'workspace-1', name: 'My Workspace', slug: 'my-workspace', planType: PlanTypeWorkspace.FREE,
    });
    roleRepository.saveMany.mockResolvedValue([
      { id: 'role-owner', name: RoleName.OWNER },
      { id: 'role-admin', name: RoleName.ADMIN },
      { id: 'role-member', name: RoleName.MEMBER },
      { id: 'role-viewer', name: RoleName.VIEWER },
    ]);
    
    // Return a dummy permission so permissions.length > 0
    findPermissionRepository.findAll.mockResolvedValue([{ id: 'dummy-1', code: 'DUMMY_CODE' }]);

    await expect(
      service.create(userId, { name: 'My Workspace', templateId: 'template-1' })
    ).rejects.toMatchObject({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });

    expect(createRolePermissionService.createMany).not.toHaveBeenCalled();
  });

  it('generates BLANK_PAGE template config correctly', () => {
    const config = (service as any).getTemplateConfig({
      template: WorkspaceTemplateType.BLANK_PAGE,
      workspaceName: 'My Workspace'
    });
    expect(config.projects).toHaveLength(0);
  });

  it('generates BLANK_DATABASE template config correctly', () => {
    const config = (service as any).getTemplateConfig({
      template: WorkspaceTemplateType.BLANK_DATABASE,
      workspaceName: 'My Workspace'
    });
    expect(config.projects).toHaveLength(1);
  });
});
