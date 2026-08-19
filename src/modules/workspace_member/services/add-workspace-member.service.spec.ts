import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';
import { WORKSPACE_MEMBER_TYPES } from '../interfaces/types';
import { AddWorkspaceMemberServiceImpl } from './add-workspace-member.service';

describe('AddWorkspaceMemberServiceImpl', () => {
  let service: AddWorkspaceMemberServiceImpl;

  const findWorkspaceMemberRepository = {
    findMemberInWorkspace: jest.fn(),
  };

  const workspaceMemberRepository = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddWorkspaceMemberServiceImpl,
        {
          provide:
            WORKSPACE_MEMBER_TYPES.repositories.FindWorkspaceMemberRepository,
          useValue: findWorkspaceMemberRepository,
        },
        {
          provide:
            WORKSPACE_MEMBER_TYPES.repositories.WorkspaceMemberRepository,
          useValue: workspaceMemberRepository,
        },
      ],
    }).compile();

    service = module.get(AddWorkspaceMemberServiceImpl);
  });

  it('rejects adding admin or owner when actor is not owner', async () => {
    findWorkspaceMemberRepository.findMemberInWorkspace.mockResolvedValueOnce({
      role_name: WorkspaceRole.MEMBER,
    });

    await expect(
      service.addMember({
        workspace_id: 'workspace-1',
        user_id: 'user-1',
        role_name: WorkspaceRole.ADMIN,
        added_by: 'actor-1',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects duplicate membership', async () => {
    findWorkspaceMemberRepository.findMemberInWorkspace.mockResolvedValueOnce({
      id: 'membership-1',
    });

    await expect(
      service.addMember({
        workspace_id: 'workspace-1',
        user_id: 'user-1',
        role_name: WorkspaceRole.MEMBER,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('creates membership with role_name directly on workspace_members', async () => {
    findWorkspaceMemberRepository.findMemberInWorkspace.mockResolvedValueOnce(
      null,
    );
    workspaceMemberRepository.create.mockResolvedValue({
      id: 'membership-1',
      role_name: WorkspaceRole.MEMBER,
    });

    const result = await service.addMember({
      workspace_id: 'workspace-1',
      user_id: 'user-1',
      role_name: WorkspaceRole.MEMBER,
    });

    expect(workspaceMemberRepository.create).toHaveBeenCalledWith(
      {
        workspace_id: 'workspace-1',
        user_id: 'user-1',
        role_name: WorkspaceRole.MEMBER,
      },
      undefined,
    );
    expect(result).toEqual({
      id: 'membership-1',
      role_name: WorkspaceRole.MEMBER,
    });
  });
});
