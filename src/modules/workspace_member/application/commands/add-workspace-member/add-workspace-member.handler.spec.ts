import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';

import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';

import { WorkspaceMemberModel } from '../../../domain/models/workspace-member.model';
import { WORKSPACE_MEMBER_TYPES } from '../../../interfaces/types';
import { AddWorkspaceMemberCommand } from './add-workspace-member.command';
import { AddWorkspaceMemberHandler } from './add-workspace-member.handler';

describe('AddWorkspaceMemberHandler', () => {
  let handler: AddWorkspaceMemberHandler;

  const mockAddWorkspaceMemberService = {
    addMember: jest.fn(),
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
          provide: WORKSPACE_MEMBER_TYPES.services.AddWorkspaceMemberService,
          useValue: mockAddWorkspaceMemberService,
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

    handler = module.get<AddWorkspaceMemberHandler>(AddWorkspaceMemberHandler);
  });

  it('should add a workspace member in transaction and write activity', async () => {
    const model = new WorkspaceMemberModel(
      'member-1',
      'ws-1',
      'user-1',
      WorkspaceRole.ADMIN,
      new Date(),
    );
    mockAddWorkspaceMemberService.addMember.mockResolvedValue(model);

    const result = await handler.execute(
      new AddWorkspaceMemberCommand(
        'ws-1',
        'user-1',
        WorkspaceRole.ADMIN,
        'adder-1',
      ),
    );

    expect(mockUow.runInTransaction).toHaveBeenCalled();
    expect(mockAddWorkspaceMemberService.addMember).toHaveBeenCalledWith(
      {
        workspace_id: 'ws-1',
        user_id: 'user-1',
        role_name: WorkspaceRole.ADMIN,
        added_by: 'adder-1',
      },
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
