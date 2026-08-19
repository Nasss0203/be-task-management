import { Test, TestingModule } from '@nestjs/testing';

import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';

import { WorkspaceMemberDetailModel } from '../../../domain/models/workspace-member.model';
import { WORKSPACE_MEMBER_TYPES } from '../../../interfaces/types';
import { ListWorkspaceMembersHandler } from './list-workspace-members.handler';
import { ListWorkspaceMembersQuery } from './list-workspace-members.query';

describe('ListWorkspaceMembersHandler', () => {
  let handler: ListWorkspaceMembersHandler;

  const mockFindWorkspaceMemberService = {
    findAllMember: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListWorkspaceMembersHandler,
        {
          provide: WORKSPACE_MEMBER_TYPES.services.FindWorkspaceMemberService,
          useValue: mockFindWorkspaceMemberService,
        },
      ],
    }).compile();

    handler = module.get<ListWorkspaceMembersHandler>(
      ListWorkspaceMembersHandler,
    );
  });

  it('should return mapped workspace members', async () => {
    const member = new WorkspaceMemberDetailModel(
      'member-1',
      'ws-1',
      'user-1',
      'Ada Lovelace',
      'ada@example.com',
      WorkspaceRole.MEMBER,
      null,
      null,
      new Date(),
    );
    mockFindWorkspaceMemberService.findAllMember.mockResolvedValue([member]);

    const result = await handler.execute(new ListWorkspaceMembersQuery('ws-1'));

    expect(mockFindWorkspaceMemberService.findAllMember).toHaveBeenCalledWith(
      'ws-1',
    );
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
