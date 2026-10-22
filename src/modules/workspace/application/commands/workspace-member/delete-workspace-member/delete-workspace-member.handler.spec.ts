import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { ACTIVITY_TYPES } from 'src/modules/activity/activity.types';
import { WorkspaceMember } from 'src/modules/workspace/domain/aggregates/workspace-member/workspace-member.aggregate';
import { WorkspaceMembershipType } from 'src/modules/workspace/domain/enums/workspace-membership-type.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import { Workspace } from 'src/modules/workspace/domain/aggregates/workspace/workspace.aggregate';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import type { EntityManager } from 'typeorm';
import { DeleteWorkspaceMemberCommand } from './delete-workspace-member.command';
import { DeleteWorkspaceMemberHandler } from './delete-workspace-member.handler';
import { WorkspaceSoftDeleteService } from '../../../services/workspace-soft-delete.service';
describe('DeleteWorkspaceMemberHandler', () => {
  let handler: DeleteWorkspaceMemberHandler;

  const mockWorkspaceMemberRepository = {
    findByWorkspaceAndUser: jest.fn(),
    findByWorkspace: jest.fn(),
    deleteByWorkspaceAndUser: jest.fn(),
  };

  const mockWorkspaceRepository = {
    findByUserId: jest.fn(),
  };

  const mockTeamspaceOwnershipGuard = {
    assertCanRemoveWorkspaceMember: jest.fn(),
  };

  const mockManager = {} as EntityManager;
  const mockUow = {
    runInTransaction: jest
      .fn()
      .mockImplementation((cb: (context: PersistenceContext) => unknown) =>
        cb(mockManager),
      ),
  };

  const mockCreateActivityService = {
    create: jest.fn(),
  };

  const mockWorkspaceSoftDeleteService = {
    execute: jest.fn(),
  };

  const mockUserProfilePreferenceService = {
    getLastActiveWorkspace: jest.fn(),
    updateLastActiveWorkspace: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockTeamspaceOwnershipGuard.assertCanRemoveWorkspaceMember.mockReset();
    mockTeamspaceOwnershipGuard.assertCanRemoveWorkspaceMember.mockResolvedValue(undefined);
    mockUserProfilePreferenceService.getLastActiveWorkspace.mockResolvedValue(
      null,
    );
    mockWorkspaceRepository.findByUserId.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteWorkspaceMemberHandler,
        {
          provide: WORKSPACE_TYPES.repositories.WorkspaceMemberRepository,
          useValue: mockWorkspaceMemberRepository,
        },
        {
          provide: WORKSPACE_TYPES.repositories.WorkspaceRepository,
          useValue: mockWorkspaceRepository,
        },
        {
          provide: WORKSPACE_TYPES.ports.TeamspaceOwnershipGuard,
          useValue: mockTeamspaceOwnershipGuard,
        },
        {
          provide: PERSISTENCE_TYPES.UnitOfWork,
          useValue: mockUow,
        },
        {
          provide: ACTIVITY_TYPES.services.CreateActivityService,
          useValue: mockCreateActivityService,
        },
        {
          provide: WorkspaceSoftDeleteService,
          useValue: mockWorkspaceSoftDeleteService,
        },
        {
          provide: IDENTITY_TYPES.services.UserProfilePreferenceService,
          useValue: mockUserProfilePreferenceService,
        },
      ],
    }).compile();

    handler = module.get<DeleteWorkspaceMemberHandler>(
      DeleteWorkspaceMemberHandler,
    );
  });

  it('should delete a workspace member in transaction and write activity', async () => {
    mockWorkspaceMemberRepository.findByWorkspaceAndUser
      .mockResolvedValueOnce(
        WorkspaceMember.restore({
          id: 'member-1',
          workspaceId: 'ws-1',
          userId: 'user-1',
          membershipType: WorkspaceMembershipType.MEMBER,
          role: WorkspaceRole.MEMBER,
          joinedAt: new Date(),
          lastOpenedAt: null,
        }),
      )
      .mockResolvedValueOnce(
        WorkspaceMember.restore({
          id: 'actor-member-1',
          workspaceId: 'ws-1',
          userId: 'actor-1',
          membershipType: WorkspaceMembershipType.MEMBER,
          role: WorkspaceRole.OWNER,
          joinedAt: new Date(),
          lastOpenedAt: null,
        }),
      );

    await handler.execute(
      new DeleteWorkspaceMemberCommand('ws-1', 'user-1', 'actor-1'),
    );

    expect(mockUow.runInTransaction).toHaveBeenCalled();
    expect(mockTeamspaceOwnershipGuard.assertCanRemoveWorkspaceMember).toHaveBeenCalledWith(
      'ws-1',
      'member-1',
      mockManager,
    );
    expect(
      mockWorkspaceMemberRepository.deleteByWorkspaceAndUser,
    ).toHaveBeenCalledWith('ws-1', 'user-1', mockManager);
    expect(mockCreateActivityService.create).toHaveBeenCalledWith(
      {
        workspaceId: 'ws-1',
        entityType: ActivityEntityType.WORKSPACE,
        entityId: 'ws-1',
        actorId: 'actor-1',
        action: ActivityAction.WORKSPACE_MEMBER_REMOVED,
        metadata: {
          userId: 'user-1',
        },
      },
      mockManager,
    );
  });

  it('should soft delete the workspace and keep membership when the last owner leaves', async () => {
    const lastOwner = WorkspaceMember.restore({
      id: 'owner-member-1',
      workspaceId: 'ws-1',
      userId: 'owner-1',
      membershipType: WorkspaceMembershipType.MEMBER,
      role: WorkspaceRole.OWNER,
      joinedAt: new Date(),
      lastOpenedAt: null,
    });

    mockWorkspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
      lastOwner,
    );
    mockWorkspaceMemberRepository.findByWorkspace.mockResolvedValueOnce([
      lastOwner,
    ]);
    mockUserProfilePreferenceService.getLastActiveWorkspace.mockResolvedValueOnce(
      'ws-1',
    );
    mockWorkspaceRepository.findByUserId.mockResolvedValueOnce([
      Workspace.create({ id: 'ws-2', name: 'Workspace 2', slug: 'ws-2' }),
    ]);

    await handler.execute(
      new DeleteWorkspaceMemberCommand('ws-1', 'owner-1', 'owner-1'),
    );

    expect(mockWorkspaceSoftDeleteService.execute).toHaveBeenCalledWith(
      'owner-1',
      'ws-1',
      mockManager,
    );
    expect(
      mockWorkspaceMemberRepository.deleteByWorkspaceAndUser,
    ).not.toHaveBeenCalled();
    expect(mockTeamspaceOwnershipGuard.assertCanRemoveWorkspaceMember).not.toHaveBeenCalled();
    expect(mockCreateActivityService.create).not.toHaveBeenCalled();
    expect(
      mockUserProfilePreferenceService.updateLastActiveWorkspace,
    ).toHaveBeenCalledWith('owner-1', 'ws-2', mockManager);
  });

  it('should not update preference when leaving a non-last-active workspace', async () => {
    mockWorkspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
      WorkspaceMember.restore({
        id: 'member-1',
        workspaceId: 'ws-1',
        userId: 'user-1',
        membershipType: WorkspaceMembershipType.MEMBER,
        role: WorkspaceRole.MEMBER,
        joinedAt: new Date(),
        lastOpenedAt: null,
      }),
    );
    mockUserProfilePreferenceService.getLastActiveWorkspace.mockResolvedValueOnce(
      'ws-2',
    );

    await handler.execute(
      new DeleteWorkspaceMemberCommand('ws-1', 'user-1', 'user-1'),
    );

    expect(mockWorkspaceRepository.findByUserId).not.toHaveBeenCalled();
    expect(
      mockUserProfilePreferenceService.updateLastActiveWorkspace,
    ).not.toHaveBeenCalled();
  });

  it('should select another active workspace after leaving the last-active workspace', async () => {
    mockWorkspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
      WorkspaceMember.restore({
        id: 'member-1',
        workspaceId: 'ws-1',
        userId: 'user-1',
        membershipType: WorkspaceMembershipType.MEMBER,
        role: WorkspaceRole.MEMBER,
        joinedAt: new Date(),
        lastOpenedAt: null,
      }),
    );
    mockUserProfilePreferenceService.getLastActiveWorkspace.mockResolvedValueOnce(
      'ws-1',
    );
    mockWorkspaceRepository.findByUserId.mockResolvedValueOnce([
      Workspace.create({ id: 'ws-2', name: 'Workspace 2', slug: 'ws-2' }),
    ]);

    await handler.execute(
      new DeleteWorkspaceMemberCommand('ws-1', 'user-1', 'user-1'),
    );

    expect(mockWorkspaceRepository.findByUserId).toHaveBeenCalledWith(
      'user-1',
      mockManager,
    );
    expect(
      mockUserProfilePreferenceService.updateLastActiveWorkspace,
    ).toHaveBeenCalledWith('user-1', 'ws-2', mockManager);
  });

  it('should clear last-active workspace when no active workspace remains', async () => {
    mockWorkspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(
      WorkspaceMember.restore({
        id: 'member-1',
        workspaceId: 'ws-1',
        userId: 'user-1',
        membershipType: WorkspaceMembershipType.MEMBER,
        role: WorkspaceRole.MEMBER,
        joinedAt: new Date(),
        lastOpenedAt: null,
      }),
    );
    mockUserProfilePreferenceService.getLastActiveWorkspace.mockResolvedValueOnce(
      'ws-1',
    );
    mockWorkspaceRepository.findByUserId.mockResolvedValueOnce([]);

    await handler.execute(
      new DeleteWorkspaceMemberCommand('ws-1', 'user-1', 'user-1'),
    );

    expect(
      mockUserProfilePreferenceService.updateLastActiveWorkspace,
    ).toHaveBeenCalledWith('user-1', null, mockManager);
  });

  const member = (id: string, userId: string, role: WorkspaceRole) =>
    WorkspaceMember.restore({
      id,
      workspaceId: 'ws-1',
      userId,
      membershipType: WorkspaceMembershipType.MEMBER,
      role,
      joinedAt: new Date(),
      lastOpenedAt: null,
    });

  it('returns 409 without deleting when a Teamspace would lose its last owner', async () => {
    mockWorkspaceMemberRepository.findByWorkspaceAndUser
      .mockResolvedValueOnce(member('member-1', 'user-1', WorkspaceRole.MEMBER))
      .mockResolvedValueOnce(member('actor-1', 'actor-1', WorkspaceRole.OWNER));
    mockTeamspaceOwnershipGuard.assertCanRemoveWorkspaceMember.mockRejectedValueOnce(
      new ConflictException('Cannot remove the last Teamspace owner'),
    );

    await expect(
      handler.execute(new DeleteWorkspaceMemberCommand('ws-1', 'user-1', 'actor-1')),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(mockWorkspaceMemberRepository.deleteByWorkspaceAndUser).not.toHaveBeenCalled();
    expect(mockCreateActivityService.create).not.toHaveBeenCalled();
  });

  it('allows removal when other Teamspace owners remain or the member owns none', async () => {
    for (const userId of ['owner-with-peers', 'no-teamspace']) {
      mockWorkspaceMemberRepository.findByWorkspaceAndUser
        .mockResolvedValueOnce(member(`member-${userId}`, userId, WorkspaceRole.MEMBER))
        .mockResolvedValueOnce(member('actor-1', 'actor-1', WorkspaceRole.OWNER));
      await handler.execute(new DeleteWorkspaceMemberCommand('ws-1', userId, 'actor-1'));
    }

    expect(mockWorkspaceMemberRepository.deleteByWorkspaceAndUser).toHaveBeenCalledTimes(2);
    expect(mockTeamspaceOwnershipGuard.assertCanRemoveWorkspaceMember).toHaveBeenCalledTimes(2);
  });

  it('does not partially delete membership when one of several Teamspaces has a last owner', async () => {
    mockWorkspaceMemberRepository.findByWorkspaceAndUser
      .mockResolvedValueOnce(member('member-1', 'user-1', WorkspaceRole.MEMBER))
      .mockResolvedValueOnce(member('actor-1', 'actor-1', WorkspaceRole.OWNER));
    mockTeamspaceOwnershipGuard.assertCanRemoveWorkspaceMember.mockRejectedValueOnce(
      new ConflictException('Cannot remove the last Teamspace owner'),
    );

    await expect(
      handler.execute(new DeleteWorkspaceMemberCommand('ws-1', 'user-1', 'actor-1')),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(mockWorkspaceMemberRepository.deleteByWorkspaceAndUser).not.toHaveBeenCalled();
    expect(mockUserProfilePreferenceService.updateLastActiveWorkspace).not.toHaveBeenCalled();
  });

  it('preserves not-found and authorization errors before the guard', async () => {
    mockWorkspaceMemberRepository.findByWorkspaceAndUser.mockResolvedValueOnce(null);
    await expect(
      handler.execute(new DeleteWorkspaceMemberCommand('ws-1', 'missing', 'actor-1')),
    ).rejects.toBeInstanceOf(NotFoundException);

    mockWorkspaceMemberRepository.findByWorkspaceAndUser
      .mockResolvedValueOnce(member('member-1', 'user-1', WorkspaceRole.MEMBER))
      .mockResolvedValueOnce(member('actor-1', 'actor-1', WorkspaceRole.MEMBER));
    await expect(
      handler.execute(new DeleteWorkspaceMemberCommand('ws-1', 'user-1', 'actor-1')),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(mockTeamspaceOwnershipGuard.assertCanRemoveWorkspaceMember).not.toHaveBeenCalled();
  });

  it('propagates a guard database error and never deletes the member', async () => {
    mockWorkspaceMemberRepository.findByWorkspaceAndUser
      .mockResolvedValueOnce(member('member-1', 'user-1', WorkspaceRole.MEMBER))
      .mockResolvedValueOnce(member('actor-1', 'actor-1', WorkspaceRole.OWNER));
    const error = new Error('database unavailable');
    mockTeamspaceOwnershipGuard.assertCanRemoveWorkspaceMember.mockRejectedValueOnce(error);

    await expect(
      handler.execute(new DeleteWorkspaceMemberCommand('ws-1', 'user-1', 'actor-1')),
    ).rejects.toBe(error);
    expect(mockWorkspaceMemberRepository.deleteByWorkspaceAndUser).not.toHaveBeenCalled();
  });
});
