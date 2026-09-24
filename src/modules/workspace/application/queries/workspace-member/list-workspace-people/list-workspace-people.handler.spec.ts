import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { WorkspaceMemberDetail } from 'src/modules/workspace/domain/aggregates/workspace-member/workspace-member.aggregate';
import { WorkspaceMembershipType } from 'src/modules/workspace/domain/enums/workspace-membership-type.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';

import { ListWorkspacePeopleHandler } from './list-workspace-people.handler';
import { ListWorkspacePeopleQuery } from './list-workspace-people.query';

describe('ListWorkspacePeopleHandler', () => {
  let handler: ListWorkspacePeopleHandler;

  const mockWorkspaceMemberRepository = {
    findPeopleByWorkspace: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListWorkspacePeopleHandler,
        {
          provide: WORKSPACE_TYPES.repositories.WorkspaceMemberRepository,
          useValue: mockWorkspaceMemberRepository,
        },
      ],
    }).compile();

    handler = module.get<ListWorkspacePeopleHandler>(
      ListWorkspacePeopleHandler,
    );
  });

  it('should return mapped workspace members and guests', async () => {
    const joinedAt = new Date('2026-09-24T10:00:00.000Z');
    const member = WorkspaceMemberDetail.restore({
      id: 'membership-1',
      workspaceId: 'workspace-1',
      userId: 'user-1',
      fullName: 'owner',
      email: 'owner@example.com',
      membershipType: WorkspaceMembershipType.MEMBER,
      role: WorkspaceRole.OWNER,
      avatarUrl: null,
      lastOpenedAt: null,
      joinedAt,
    });
    const guest = WorkspaceMemberDetail.restore({
      id: 'membership-2',
      workspaceId: 'workspace-1',
      userId: 'user-2',
      fullName: 'guest-user',
      email: 'guest@example.com',
      membershipType: WorkspaceMembershipType.GUEST,
      role: null,
      avatarUrl: null,
      lastOpenedAt: null,
      joinedAt,
    });
    mockWorkspaceMemberRepository.findPeopleByWorkspace.mockResolvedValue([
      member,
      guest,
    ]);

    const result = await handler.execute(
      new ListWorkspacePeopleQuery('workspace-1'),
    );

    expect(
      mockWorkspaceMemberRepository.findPeopleByWorkspace,
    ).toHaveBeenCalledWith('workspace-1');
    expect(result).toEqual([
      expect.objectContaining({
        membership_type: WorkspaceMembershipType.MEMBER,
        role_name: WorkspaceRole.OWNER,
      }),
      expect.objectContaining({
        membership_type: WorkspaceMembershipType.GUEST,
        role_name: null,
      }),
    ]);
  });

  it('should reject an empty workspace id', async () => {
    await expect(
      handler.execute(new ListWorkspacePeopleQuery('  ')),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(
      mockWorkspaceMemberRepository.findPeopleByWorkspace,
    ).not.toHaveBeenCalled();
  });
});
