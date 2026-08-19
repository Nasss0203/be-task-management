import { Test, TestingModule } from '@nestjs/testing';
import { CreateWorkspaceInviteLinkApplicationImpl } from './create-workspace-invite-link.application';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';
import { WORKSPACE_MEMBER_TYPES } from 'src/modules/workspace_member/interfaces/types';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';

describe('CreateWorkspaceInviteLinkApplicationImpl', () => {
  let app: CreateWorkspaceInviteLinkApplicationImpl;

  const mockRepo = {
    save: jest.fn(),
  };

  const mockFindWorkspaceMemberService = {
    findMemberInWorkspace: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateWorkspaceInviteLinkApplicationImpl,
        {
          provide:
            WORKSPACE_INVITE_TYPES.repositories.CreateWorkspaceInviteRepository,
          useValue: mockRepo,
        },
        {
          provide: WORKSPACE_MEMBER_TYPES.services.FindWorkspaceMemberService,
          useValue: mockFindWorkspaceMemberService,
        },
      ],
    }).compile();

    app = module.get<CreateWorkspaceInviteLinkApplicationImpl>(
      CreateWorkspaceInviteLinkApplicationImpl,
    );
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should create link', async () => {
    mockRepo.save.mockResolvedValue({ id: 'inv-1', token: 'tok-1' });
    const result = await app.createLink('ws-1', 'u-1', {
      role_name: WorkspaceRole.MEMBER,
    } as any);
    expect(mockRepo.save).toHaveBeenCalled();
    expect(result.id).toEqual('inv-1');
  });

  it('should throw if workspaceId missing', async () => {
    await expect(
      app.createLink('', 'u-1', { role_name: WorkspaceRole.MEMBER } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw if role is OWNER and inviter is not OWNER', async () => {
    mockFindWorkspaceMemberService.findMemberInWorkspace.mockResolvedValue({
      role_name: WorkspaceRole.MEMBER,
    });
    await expect(
      app.createLink('ws-1', 'u-1', { role_name: WorkspaceRole.OWNER } as any),
    ).rejects.toThrow(ForbiddenException);
  });
});
