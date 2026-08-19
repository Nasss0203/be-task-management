import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';

import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';

import { WORKSPACE_MEMBER_TYPES } from '../../../interfaces/types';
import { DeleteWorkspaceMemberCommand } from './delete-workspace-member.command';
import { DeleteWorkspaceMemberHandler } from './delete-workspace-member.handler';

describe('DeleteWorkspaceMemberHandler', () => {
  let handler: DeleteWorkspaceMemberHandler;

  const mockDeleteWorkspaceMemberService = {
    deleteMember: jest.fn(),
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
        DeleteWorkspaceMemberHandler,
        {
          provide: WORKSPACE_MEMBER_TYPES.services.DeleteWorkspaceMemberService,
          useValue: mockDeleteWorkspaceMemberService,
        },
        {
          provide: WORKSPACE_MEMBER_TYPES.uow.UnitOfWork,
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
    await handler.execute(
      new DeleteWorkspaceMemberCommand('ws-1', 'user-1', 'actor-1'),
    );

    expect(mockUow.runInTransaction).toHaveBeenCalled();
    expect(mockDeleteWorkspaceMemberService.deleteMember).toHaveBeenCalledWith(
      {
        workspace_id: 'ws-1',
        user_id: 'user-1',
        actor_id: 'actor-1',
      },
      mockManager,
    );
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
