import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { WorkspaceMember } from 'src/modules/workspace/domain/aggregates/workspace-member/workspace-member.aggregate';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { UpdateWorkspaceMemberRoleCommand } from './update-workspace-member-role.command';
import { UpdateWorkspaceMemberRoleHandler } from './update-workspace-member-role.handler';
describe('UpdateWorkspaceMemberRoleHandler', () => {
  let handler: UpdateWorkspaceMemberRoleHandler;

  const mockWorkspaceMemberRepository = {
    findByWorkspaceAndUser: jest.fn(),
    findByWorkspace: jest.fn(),
    save: jest.fn(),
  };

  const mockManager = {} as EntityManager;
  const mockUow = {
    runInTransaction: jest
      .fn()
      .mockImplementation((cb: (manager: EntityManager) => unknown) =>
        cb(mockManager),
      ),
  };

  const mockCreateActivityService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateWorkspaceMemberRoleHandler,
        {
          provide: WORKSPACE_TYPES.repositories.WorkspaceMemberRepository,
          useValue: mockWorkspaceMemberRepository,
        },
        {
          provide: PERSISTENCE_TYPES.UnitOfWork,
          useValue: mockUow,
        },
        {
          provide: ACTIVITY_TYPES.services.CreateActivityService,
          useValue: mockCreateActivityService,
        },
      ],
    }).compile();

    handler = module.get<UpdateWorkspaceMemberRoleHandler>(
      UpdateWorkspaceMemberRoleHandler,
    );
  });

  it('should update role in transaction and write activity', async () => {
    const actorMember = WorkspaceMember.restore({
      id: 'actor-member-1',
      workspaceId: 'ws-1',
      userId: 'actor-1',
      role: WorkspaceRole.OWNER,
      joinedAt: new Date(),
      lastOpenedAt: null,
    });
    const targetMember = WorkspaceMember.restore({
      id: 'member-1',
      workspaceId: 'ws-1',
      userId: 'user-1',
      role: WorkspaceRole.MEMBER,
      joinedAt: new Date(),
      lastOpenedAt: null,
    });

    mockWorkspaceMemberRepository.findByWorkspaceAndUser
      .mockResolvedValueOnce(actorMember)
      .mockResolvedValueOnce(targetMember);

    await handler.execute(
      new UpdateWorkspaceMemberRoleCommand(
        'ws-1',
        'user-1',
        WorkspaceRole.ADMIN,
        'actor-1',
      ),
    );

    expect(mockUow.runInTransaction).toHaveBeenCalled();
    expect(targetMember.getRole()).toBe(WorkspaceRole.ADMIN);
    expect(mockWorkspaceMemberRepository.save).toHaveBeenCalledWith(
      targetMember,
      mockManager,
    );
    expect(mockCreateActivityService.create).toHaveBeenCalledWith(
      {
        workspaceId: 'ws-1',
        entityType: ActivityEntityType.WORKSPACE,
        entityId: 'ws-1',
        actorId: 'actor-1',
        action: ActivityAction.WORKSPACE_MEMBER_ROLE_CHANGED,
        metadata: {
          userId: 'user-1',
          newWorkspaceRole: WorkspaceRole.ADMIN,
        },
      },
      mockManager,
    );
  });
});
