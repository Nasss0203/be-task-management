import { Test, TestingModule } from '@nestjs/testing';
import { WORKSPACE_TYPES } from '../interfaces/types';
import { WorkspacesController } from './workspaces.controller';

describe('WorkspacesController', () => {
  let controller: WorkspacesController;

  const createWorkspaceApplication = {
    createDeault: jest.fn(),
  };

  const findWorkspaceApplication = {
    findAllByUserId: jest.fn(),
    findOneWorkspaceById: jest.fn(),
  };

  const accessWorkspaceApplication = {
    getWorkspaceAccess: jest.fn(),
  };

  const workspaceTrashApplication = {
    findDeletedWorkspacesByUserId: jest.fn(),
    softDeleteWorkspace: jest.fn(),
    restoreWorkspace: jest.fn(),
    removeWorkspaceFromUserTrash: jest.fn(),
  };

  const findWorkspaceOverviewApplication = {
    findOverview: jest.fn(),
  };

  const updateWorkspaceApplication = {
    update: jest.fn(),
  };

  const updateWorkspaceLayoutModeApplication = {
    updateLayoutMode: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspacesController],
      providers: [
        {
          provide: WORKSPACE_TYPES.applications.CreateWorkspaceApplication,
          useValue: createWorkspaceApplication,
        },
        {
          provide: WORKSPACE_TYPES.applications.FindWorkspaceApplication,
          useValue: findWorkspaceApplication,
        },
        {
          provide: WORKSPACE_TYPES.applications.AccessWorkspaceApplication,
          useValue: accessWorkspaceApplication,
        },
        {
          provide: WORKSPACE_TYPES.applications.WorkspaceTrashApplication,
          useValue: workspaceTrashApplication,
        },
        {
          provide:
            WORKSPACE_TYPES.applications.FindWorkspaceOverviewApplication,
          useValue: findWorkspaceOverviewApplication,
        },
        {
          provide: WORKSPACE_TYPES.applications.UpdateWorkspaceApplication,
          useValue: updateWorkspaceApplication,
        },
        {
          provide:
            WORKSPACE_TYPES.applications.UpdateWorkspaceLayoutModeApplication,
          useValue: updateWorkspaceLayoutModeApplication,
        },
      ],
    }).compile();

    controller = module.get(WorkspacesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('creates the default workspace through the V2 application', async () => {
    const dto = { name: 'Task management' } as any;
    const auth = { id: 'user-1' } as any;
    const response = { id: 'workspace-1' };

    createWorkspaceApplication.createDeault.mockResolvedValue(response);

    await expect(controller.create(dto, auth)).resolves.toBe(response);
    expect(createWorkspaceApplication.createDeault).toHaveBeenCalledWith({
      userId: auth.id,
      createWorkspaceDto: dto,
    });
  });
});
