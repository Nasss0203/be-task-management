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
import { AddWorkspaceMemberCommand } from './add-workspace-member.command';
import { AddWorkspaceMemberHandler } from './add-workspace-member.handler';
describe('AddWorkspaceMemberHandler', () => {
  let handler: AddWorkspaceMemberHandler;

  const mockWorkspaceMemberRepository = {
    findByWorkspaceAndUser: jest.fn(),
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
        AddWorkspaceMemberHandler,
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

    handler = module.get<AddWorkspaceMemberHandler>(AddWorkspaceMemberHandler);
  });

  it('should add a workspace member in transaction and write activity', async () => {
    const model = WorkspaceMember.restore({
      id: 'member-1',
      workspaceId: 'ws-1',
      userId: 'user-1',
      role: WorkspaceRole.ADMIN,
      joinedAt: new Date(),
      lastOpenedAt: null,
    });
    mockWorkspaceMemberRepository.findByWorkspaceAndUser
      .mockResolvedValueOnce(
        WorkspaceMember.restore({
          id: 'actor-member-1',
          workspaceId: 'ws-1',
          userId: 'adder-1',
          role: WorkspaceRole.OWNER,
          joinedAt: new Date(),
          lastOpenedAt: null,
        }),
      )
      .mockResolvedValueOnce(null);
    mockWorkspaceMemberRepository.save.mockResolvedValue(model);

    const result = await handler.execute(
      new AddWorkspaceMemberCommand(
        'ws-1',
        'user-1',
        WorkspaceRole.ADMIN,
        'adder-1',
      ),
    );

    expect(mockUow.runInTransaction).toHaveBeenCalled();
    const savedMember = mockWorkspaceMemberRepository.save.mock.calls[0][0];
    expect(savedMember.getWorkspaceId()).toBe('ws-1');
    expect(savedMember.getUserId()).toBe('user-1');
    expect(savedMember.getRole()).toBe(WorkspaceRole.ADMIN);
    expect(mockWorkspaceMemberRepository.save).toHaveBeenCalledWith(
      savedMember,
      mockManager,
    );
    expect(mockCreateActivityService.create).toHaveBeenCalledWith(
      {
        workspaceId: 'ws-1',
        entityType: ActivityEntityType.WORKSPACE,
        entityId: 'ws-1',
        actorId: 'adder-1',
        action: ActivityAction.WORKSPACE_MEMBER_JOINED,
        metadata: {
          userId: 'user-1',
          roleName: WorkspaceRole.ADMIN,
        },
      },
      mockManager,
    );
    expect(result).toHaveProperty('id', 'member-1');
  });
});
