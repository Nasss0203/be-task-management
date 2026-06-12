import { Test, TestingModule } from '@nestjs/testing';
import { AcceptWorkspaceInviteApplicationImpl } from './accept-workspace-invite.application';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';
import { USER_TYPES } from 'src/modules/users/interfaces/types';
import { USER_WORKSPACE_TYPES } from 'src/modules/user_workspace/interfaces/types';
import { USER_ROLE_TYPES } from 'src/modules/user_roles/interfaces/types';
import { ROLE_TYPES } from 'src/modules/role/interfaces/types';
import { NOTIFICATION_TYPES } from 'src/modules/notifications/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { WorkspaceInviteStatus, WorkspaceInviteType } from '../domain/entities/workspace_invite.entity';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { WorkspaceInviteMapper } from '../mapper/workspace_invites.mapper';

describe('AcceptWorkspaceInviteApplicationImpl', () => {
  let app: AcceptWorkspaceInviteApplicationImpl;

  const mockFindInvite = { findByToken: jest.fn() };
  const mockAcceptInvite = { acceptWorkspaceInvite: jest.fn() };
  const mockFindUser = { findUserById: jest.fn() };
  const mockCreateUserWorkspace = { create: jest.fn() };
  const mockCreateUserRole = { create: jest.fn() };
  const mockFindRole = { findByNameAndWorkspace: jest.fn() };
  const mockUpdateNotification = { updateInviteNotificationStatus: jest.fn() };
  const mockUow = { runInTransaction: jest.fn((cb) => cb()) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcceptWorkspaceInviteApplicationImpl,
        { provide: WORKSPACE_INVITE_TYPES.services.FindWorkspaceInviteService, useValue: mockFindInvite },
        { provide: WORKSPACE_INVITE_TYPES.services.AcceptWorkspaceInviteService, useValue: mockAcceptInvite },
        { provide: USER_TYPES.services.FindUserService, useValue: mockFindUser },
        { provide: USER_WORKSPACE_TYPES.services.CreateUserWorkspaceService, useValue: mockCreateUserWorkspace },
        { provide: USER_ROLE_TYPES.services.CreateUserRoleService, useValue: mockCreateUserRole },
        { provide: ROLE_TYPES.services.FindRoleService, useValue: mockFindRole },
        { provide: NOTIFICATION_TYPES.services.UpdateNotificationService, useValue: mockUpdateNotification },
        { provide: WORKSPACE_TYPES.uow.UnitOfWork, useValue: mockUow },
      ],
    }).compile();

    app = module.get<AcceptWorkspaceInviteApplicationImpl>(AcceptWorkspaceInviteApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should accept invite', async () => {
    mockFindInvite.findByToken.mockResolvedValue({ status: WorkspaceInviteStatus.PENDING, workspace_id: 'ws-1' });
    mockFindUser.findUserById.mockResolvedValue({ id: 'u-1' });
    mockFindRole.findByNameAndWorkspace.mockResolvedValue({ id: 'r-1' });
    mockAcceptInvite.acceptWorkspaceInvite.mockResolvedValue({ id: 'inv-1', status: WorkspaceInviteStatus.ACCEPTED });
    jest.spyOn(WorkspaceInviteMapper, 'toResponse').mockReturnValue({ id: 'inv-1' } as any);

    const result = await app.acceptWorkspaceInvite({ token: 'tok-1', userId: 'u-1' });
    expect(mockCreateUserWorkspace.create).toHaveBeenCalled();
    expect(result).toEqual({ id: 'inv-1' });
  });

  it('should throw if token missing', async () => {
    await expect(app.acceptWorkspaceInvite({ userId: 'u-1' } as any)).rejects.toThrow(BadRequestException);
  });
});
