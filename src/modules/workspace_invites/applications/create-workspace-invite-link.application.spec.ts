import { Test, TestingModule } from '@nestjs/testing';
import { CreateWorkspaceInviteLinkApplicationImpl } from './create-workspace-invite-link.application';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';
import { USER_WORKSPACE_TYPES } from 'src/modules/user_workspace/interfaces/types';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { RoleName } from 'src/modules/role/domain/entities/role.entity';

describe('CreateWorkspaceInviteLinkApplicationImpl', () => {
  let app: CreateWorkspaceInviteLinkApplicationImpl;

  const mockRepo = {
    save: jest.fn(),
  };

  const mockFindMemberService = {
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
          provide: USER_WORKSPACE_TYPES.services.FindMemberService,
          useValue: mockFindMemberService,
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
      role_name: RoleName.MEMBER,
    } as any);
    expect(mockRepo.save).toHaveBeenCalled();
    expect(result.id).toEqual('inv-1');
  });

  it('should throw if workspaceId missing', async () => {
    await expect(
      app.createLink('', 'u-1', { role_name: RoleName.MEMBER } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw if role is OWNER and inviter is not OWNER', async () => {
    mockFindMemberService.findMemberInWorkspace.mockResolvedValue({
      role_name: RoleName.MEMBER,
    });
    await expect(
      app.createLink('ws-1', 'u-1', { role_name: RoleName.OWNER } as any),
    ).rejects.toThrow(ForbiddenException);
  });
});
