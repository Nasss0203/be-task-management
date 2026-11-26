import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { GetWorkspaceOverviewHandler } from './get-workspace-overview.handler';
import { GetWorkspaceOverviewQuery } from './get-workspace-overview.query';

describe('GetWorkspaceOverviewHandler', () => {
  let handler: GetWorkspaceOverviewHandler;

  const mockWorkspaceRepository = {
    findByUserIdAndWorkspaceId: jest.fn(),
    findOverview: jest.fn(),
  };
  const mockPageRepository = {
    countAccessibleByWorkspace: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetWorkspaceOverviewHandler,
        {
          provide: WORKSPACE_TYPES.repositories.WorkspaceRepository,
          useValue: mockWorkspaceRepository,
        },
        {
          provide: CONTENT_TYPES.repositories.PageRepository,
          useValue: mockPageRepository,
        },
      ],
    }).compile();

    handler = module.get(GetWorkspaceOverviewHandler);
  });

  it('adds the page counts the reader can see to the member count', async () => {
    mockWorkspaceRepository.findByUserIdAndWorkspaceId.mockResolvedValue({});
    mockWorkspaceRepository.findOverview.mockResolvedValue({
      workspaceId: 'ws-1',
      metrics: { members: 4 },
    });
    mockPageRepository.countAccessibleByWorkspace.mockResolvedValue({
      pages: 12,
      databases: 3,
      updatedLast7Days: 5,
    });

    await expect(
      handler.execute(new GetWorkspaceOverviewQuery('user-1', 'ws-1')),
    ).resolves.toEqual({
      workspaceId: 'ws-1',
      metrics: { members: 4, pages: 12, databases: 3, updatedLast7Days: 5 },
    });
    expect(mockPageRepository.countAccessibleByWorkspace).toHaveBeenCalledWith(
      'ws-1',
      'user-1',
    );
  });

  it('returns 404 to someone outside the workspace without counting pages', async () => {
    mockWorkspaceRepository.findByUserIdAndWorkspaceId.mockResolvedValue(null);

    await expect(
      handler.execute(new GetWorkspaceOverviewQuery('user-2', 'ws-1')),
    ).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
    expect(
      mockPageRepository.countAccessibleByWorkspace,
    ).not.toHaveBeenCalled();
  });
});
