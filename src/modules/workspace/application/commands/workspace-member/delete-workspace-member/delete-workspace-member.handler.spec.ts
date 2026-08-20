import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { Test, TestingModule } from '@nestjs/testing';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { WorkspaceMember } from 'src/modules/workspace/domain/aggregates/workspace-member/workspace-member.aggregate';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { DeleteWorkspaceMemberCommand } from './delete-workspace-member.command';
import { DeleteWorkspaceMemberHandler } from './delete-workspace-member.handler';
describe('DeleteWorkspaceMemberHandler', () => {
  let handler: DeleteWorkspaceMemberHandler;

  const mockWorkspaceMemberRepository = {
    findByWorkspaceAndUser: jest.fn(),
    findByWorkspace: jest.fn(),
    deleteByWorkspaceAndUser: jest.fn(),
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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteWorkspaceMemberHandler,
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
          role: WorkspaceRole.OWNER,
          joinedAt: new Date(),
          lastOpenedAt: null,
        }),
      );

    await handler.execute(
      new DeleteWorkspaceMemberCommand('ws-1', 'user-1', 'actor-1'),
    );

    expect(mockUow.runInTransaction).toHaveBeenCalled();
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
});
