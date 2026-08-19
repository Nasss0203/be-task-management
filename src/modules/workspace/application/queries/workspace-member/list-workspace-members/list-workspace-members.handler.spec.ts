import { Test, TestingModule } from '@nestjs/testing';

import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';

import { WorkspaceMemberDetail } from 'src/modules/workspace/domain/aggregates/workspace-member/workspace-member.aggregate';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { ListWorkspaceMembersHandler } from './list-workspace-members.handler';
import { ListWorkspaceMembersQuery } from './list-workspace-members.query';

describe('ListWorkspaceMembersHandler', () => {
  let handler: ListWorkspaceMembersHandler;

  const mockWorkspaceMemberRepository = {
    findDetailsByWorkspace: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListWorkspaceMembersHandler,
        {
          provide: WORKSPACE_TYPES.repositories.WorkspaceMemberRepository,
          useValue: mockWorkspaceMemberRepository,
        },
      ],
    }).compile();

    handler = module.get<ListWorkspaceMembersHandler>(
      ListWorkspaceMembersHandler,
    );
  });

  it('should return mapped workspace members', async () => {
    const member = WorkspaceMemberDetail.restore({
      id: 'member-1',
      workspaceId: 'ws-1',
      userId: 'user-1',
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      role: WorkspaceRole.MEMBER,
      avatarUrl: null,
      lastOpenedAt: null,
      joinedAt: new Date(),
      taskCount: 0,
    });
    mockWorkspaceMemberRepository.findDetailsByWorkspace.mockResolvedValue([
      member,
    ]);

    const result = await handler.execute(new ListWorkspaceMembersQuery('ws-1'));

    expect(
      mockWorkspaceMemberRepository.findDetailsByWorkspace,
    ).toHaveBeenCalledWith('ws-1');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 'member-1',
        workspace_id: 'ws-1',
        user_id: 'user-1',
        role_name: WorkspaceRole.MEMBER,
      }),
    );
  });
});
