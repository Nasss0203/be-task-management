import { Test, TestingModule } from '@nestjs/testing';
import { CreateWorkspaceHandler } from 'src/modules/workspace/application/commands/workspace/create-workspace/create-workspace.handler';
import { RemoveWorkspaceFromTrashHandler } from 'src/modules/workspace/application/commands/workspace/remove-workspace-from-trash/remove-workspace-from-trash.handler';
import { RestoreWorkspaceHandler } from 'src/modules/workspace/application/commands/workspace/restore-workspace/restore-workspace.handler';
import { SoftDeleteWorkspaceHandler } from 'src/modules/workspace/application/commands/workspace/soft-delete-workspace/soft-delete-workspace.handler';
import { UpdateWorkspaceHandler } from 'src/modules/workspace/application/commands/workspace/update-workspace/update-workspace.handler';
import { UpdateWorkspaceLayoutModeHandler } from 'src/modules/workspace/application/commands/workspace/update-workspace-layout-mode/update-workspace-layout-mode.handler';
import { GetWorkspaceHandler } from 'src/modules/workspace/application/queries/workspace/get-workspace/get-workspace.handler';
import { GetWorkspaceAccessHandler } from 'src/modules/workspace/application/queries/workspace/get-workspace-access/get-workspace-access.handler';
import { GetWorkspaceOverviewHandler } from 'src/modules/workspace/application/queries/workspace/get-workspace-overview/get-workspace-overview.handler';
import { ListDeletedWorkspacesHandler } from 'src/modules/workspace/application/queries/workspace/list-deleted-workspaces/list-deleted-workspaces.handler';
import { ListWorkspacesHandler } from 'src/modules/workspace/application/queries/workspace/list-workspaces/list-workspaces.handler';
import { WorkspacesController } from './workspace.controller';

describe('WorkspacesController', () => {
  let controller: WorkspacesController;

  const createWorkspaceHandler = { execute: jest.fn() };
  const listWorkspacesHandler = { execute: jest.fn() };
  const getWorkspaceHandler = { execute: jest.fn() };
  const getWorkspaceAccessHandler = { execute: jest.fn() };
  const listDeletedWorkspacesHandler = { execute: jest.fn() };
  const getWorkspaceOverviewHandler = { execute: jest.fn() };
  const updateWorkspaceHandler = { execute: jest.fn() };
  const updateWorkspaceLayoutModeHandler = { execute: jest.fn() };
  const softDeleteWorkspaceHandler = { execute: jest.fn() };
  const restoreWorkspaceHandler = { execute: jest.fn() };
  const removeWorkspaceFromTrashHandler = { execute: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspacesController],
      providers: [
        { provide: CreateWorkspaceHandler, useValue: createWorkspaceHandler },
        { provide: ListWorkspacesHandler, useValue: listWorkspacesHandler },
        { provide: GetWorkspaceHandler, useValue: getWorkspaceHandler },
        {
          provide: GetWorkspaceAccessHandler,
          useValue: getWorkspaceAccessHandler,
        },
        {
          provide: ListDeletedWorkspacesHandler,
          useValue: listDeletedWorkspacesHandler,
        },
        {
          provide: GetWorkspaceOverviewHandler,
          useValue: getWorkspaceOverviewHandler,
        },
        { provide: UpdateWorkspaceHandler, useValue: updateWorkspaceHandler },
        {
          provide: UpdateWorkspaceLayoutModeHandler,
          useValue: updateWorkspaceLayoutModeHandler,
        },
        {
          provide: SoftDeleteWorkspaceHandler,
          useValue: softDeleteWorkspaceHandler,
        },
        { provide: RestoreWorkspaceHandler, useValue: restoreWorkspaceHandler },
        {
          provide: RemoveWorkspaceFromTrashHandler,
          useValue: removeWorkspaceFromTrashHandler,
        },
      ],
    }).compile();

    controller = module.get(WorkspacesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
