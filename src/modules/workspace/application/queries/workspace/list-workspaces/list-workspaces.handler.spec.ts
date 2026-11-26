import { Test, TestingModule } from '@nestjs/testing';

import { Workspace } from 'src/modules/workspace/domain/aggregates/workspace/workspace.aggregate';
import { WorkspaceLayoutMode } from 'src/modules/workspace/domain/enums/workspace-layout-mode.enum';
import { WorkspaceMembershipType } from 'src/modules/workspace/domain/enums/workspace-membership-type.enum';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { ListWorkspacesHandler } from './list-workspaces.handler';
import { ListWorkspacesQuery } from './list-workspaces.query';

describe('ListWorkspacesHandler', () => {
  let handler: ListWorkspacesHandler;

  const mockWorkspaceRepository = {
    findWithMembershipByUserId: jest.fn(),
  };

  const buildWorkspace = (id: string, name: string) =>
    Workspace.restore({
      id,
      name,
      slug: id,
      layoutMode: WorkspaceLayoutMode.TABS,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      deletedBy: null,
      createdBy: null,
      icon: null,
    });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListWorkspacesHandler,
        {
          provide: WORKSPACE_TYPES.repositories.WorkspaceRepository,
          useValue: mockWorkspaceRepository,
        },
      ],
    }).compile();

    handler = module.get<ListWorkspacesHandler>(ListWorkspacesHandler);
  });

  it('returns the membership type of each workspace', async () => {
    mockWorkspaceRepository.findWithMembershipByUserId.mockResolvedValue([
      {
        workspace: buildWorkspace('ws-guest', 'Shared with me'),
        membershipType: WorkspaceMembershipType.GUEST,
      },
      {
        workspace: buildWorkspace('ws-member', 'My team'),
        membershipType: WorkspaceMembershipType.MEMBER,
      },
    ]);

    const result = await handler.execute(new ListWorkspacesQuery('user-1'));

    expect(
      mockWorkspaceRepository.findWithMembershipByUserId,
    ).toHaveBeenCalledWith('user-1');
    expect(result).toEqual([
      expect.objectContaining({
        id: 'ws-guest',
        name: 'Shared with me',
        membershipType: WorkspaceMembershipType.GUEST,
      }),
      expect.objectContaining({
        id: 'ws-member',
        name: 'My team',
        membershipType: WorkspaceMembershipType.MEMBER,
      }),
    ]);
  });

  it('returns an empty list when the user has no workspaces', async () => {
    mockWorkspaceRepository.findWithMembershipByUserId.mockResolvedValue([]);

    const result = await handler.execute(new ListWorkspacesQuery('user-1'));

    expect(result).toEqual([]);
  });
});
