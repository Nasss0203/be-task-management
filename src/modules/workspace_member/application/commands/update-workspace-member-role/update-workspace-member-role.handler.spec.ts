import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';

import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';

import { WORKSPACE_MEMBER_TYPES } from '../../../interfaces/types';
import { UpdateWorkspaceMemberRoleCommand } from './update-workspace-member-role.command';
import { UpdateWorkspaceMemberRoleHandler } from './update-workspace-member-role.handler';

describe('UpdateWorkspaceMemberRoleHandler', () => {
  let handler: UpdateWorkspaceMemberRoleHandler;

  const mockUpdateWorkspaceMemberService = {
    updateRole: jest.fn(),
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
          provide: WORKSPACE_MEMBER_TYPES.services.UpdateWorkspaceMemberService,
          useValue: mockUpdateWorkspaceMemberService,
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

    handler = module.get<UpdateWorkspaceMemberRoleHandler>(
      UpdateWorkspaceMemberRoleHandler,
    );
  });

  it('should update role in transaction and write activity', async () => {
    await handler.execute(
      new UpdateWorkspaceMemberRoleCommand(
        'ws-1',
        'user-1',
        WorkspaceRole.ADMIN,
        'actor-1',
      ),
    );

    expect(mockUow.runInTransaction).toHaveBeenCalled();
    expect(mockUpdateWorkspaceMemberService.updateRole).toHaveBeenCalledWith(
      {
        workspace_id: 'ws-1',
        user_id: 'user-1',
        role_name: WorkspaceRole.ADMIN,
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
