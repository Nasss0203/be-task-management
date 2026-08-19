import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NOTIFICATION_TYPES } from 'src/modules/notifications/interfaces/types';
import { WORKSPACE_MEMBER_TYPES } from 'src/modules/workspace_member/interfaces/types';
import { USER_TYPES } from 'src/modules/users/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';
import {
  WorkspaceInviteStatus,
  WorkspaceInviteType,
} from '../domain/entities/workspace_invite.entity';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';
import { WorkspaceInviteMapper } from '../mapper/workspace_invites.mapper';
import { AcceptWorkspaceInviteApplicationImpl } from './accept-workspace-invite.application';

describe('AcceptWorkspaceInviteApplicationImpl', () => {
  let app: AcceptWorkspaceInviteApplicationImpl;

  const manager = {} as any;
  const findInvite = { findByToken: jest.fn() };
  const acceptInvite = { acceptWorkspaceInvite: jest.fn() };
  const findUser = { findUserById: jest.fn() };
  const createWorkspaceMember = { create: jest.fn() };
  const updateNotification = { updateInviteNotificationStatus: jest.fn() };
  const uow = { runInTransaction: jest.fn((callback) => callback(manager)) };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcceptWorkspaceInviteApplicationImpl,
        {
          provide: WORKSPACE_INVITE_TYPES.services.FindWorkspaceInviteService,
          useValue: findInvite,
        },
        {
          provide: WORKSPACE_INVITE_TYPES.services.AcceptWorkspaceInviteService,
          useValue: acceptInvite,
        },
        {
          provide: USER_TYPES.services.FindUserService,
          useValue: findUser,
        },
        {
          provide: WORKSPACE_MEMBER_TYPES.services.CreateWorkspaceMemberService,
          useValue: createWorkspaceMember,
        },
        {
          provide: NOTIFICATION_TYPES.services.UpdateNotificationService,
          useValue: updateNotification,
        },
        { provide: WORKSPACE_TYPES.uow.UnitOfWork, useValue: uow },
      ],
    }).compile();

    app = module.get(AcceptWorkspaceInviteApplicationImpl);
  });

  it('accepts an invite and writes role_name on workspace_members', async () => {
    const invite = {
      id: 'invite-1',
      status: WorkspaceInviteStatus.PENDING,
      type: WorkspaceInviteType.LINK,
      workspace_id: 'workspace-1',
      role_name: WorkspaceRole.MEMBER,
      used_count: 0,
      max_uses: null,
      expires_at: new Date(Date.now() + 60_000),
    };
    const acceptedInvite = {
      ...invite,
      status: WorkspaceInviteStatus.ACCEPTED,
    };

    findInvite.findByToken.mockResolvedValue(invite);
    findUser.findUserById.mockResolvedValue({ id: 'user-1' });
    acceptInvite.acceptWorkspaceInvite.mockResolvedValue(acceptedInvite);
    jest
      .spyOn(WorkspaceInviteMapper, 'toResponse')
      .mockReturnValue({ id: acceptedInvite.id } as any);

    const result = await app.acceptWorkspaceInvite({
      token: 'token-1',
      userId: 'user-1',
    });

    expect(createWorkspaceMember.create).toHaveBeenCalledWith(
      {
        workspace_id: invite.workspace_id,
        user_id: 'user-1',
        role_name: WorkspaceRole.MEMBER,
      },
      manager,
    );
    expect(
      updateNotification.updateInviteNotificationStatus,
    ).toHaveBeenCalled();
    expect(result).toEqual({ id: acceptedInvite.id });
  });

  it('throws if token is missing', async () => {
    await expect(
      app.acceptWorkspaceInvite({ userId: 'user-1' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws if invite is not found', async () => {
    findInvite.findByToken.mockResolvedValue(null);

    await expect(
      app.acceptWorkspaceInvite({ token: 'missing', userId: 'user-1' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects email invite accepted by a different account email', async () => {
    findInvite.findByToken.mockResolvedValue({
      status: WorkspaceInviteStatus.PENDING,
      type: WorkspaceInviteType.EMAIL,
      workspace_id: 'workspace-1',
      role_name: WorkspaceRole.MEMBER,
      email: 'invited@example.com',
      used_count: 0,
      max_uses: null,
    });
    findUser.findUserById.mockResolvedValue({ id: 'user-1' });

    await expect(
      app.acceptWorkspaceInvite({
        token: 'token-1',
        userId: 'user-1',
        email: 'other@example.com',
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
