import { Test, TestingModule } from '@nestjs/testing';
import { UnitOfWork } from 'src/interface/index.interface';
import { ActivityAction, ActivityEntityType } from 'src/modules/activity/domain/entities/activity.entity';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { USER_WORKSPACE_TYPES } from '../interfaces/types';
import { AddWorkspaceMemberApplicationImpl } from './add-member-worlspace.application';

describe('AddWorkspaceMemberApplicationImpl', () => {
  let app: AddWorkspaceMemberApplicationImpl;

  const mockAddWorkspaceMemberService = {
    addMember: jest.fn(),
  };

  const mockUow = {
    runInTransaction: jest.fn().mockImplementation((cb) => cb('mockManager')),
  };

  const mockCreateActivityService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddWorkspaceMemberApplicationImpl,
        {
          provide: USER_WORKSPACE_TYPES.services.AddMemberWorkspaceService,
          useValue: mockAddWorkspaceMemberService,
        },
        {
          provide: USER_WORKSPACE_TYPES.uow.UnitOfWork,
          useValue: mockUow,
        },
        {
          provide: ACTIVITY_TYPES.services.CreateActivityService,
          useValue: mockCreateActivityService,
        },
      ],
    }).compile();

    app = module.get<AddWorkspaceMemberApplicationImpl>(
      AddWorkspaceMemberApplicationImpl,
    );
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('addMember', () => {
    it('should run in transaction, add member, create activity and return mapped response', async () => {
      const mockDto = { user_id: 'user-1', role_name: RoleName.ADMIN };
      const mockModel = {
        workspace_id: 'ws-1',
        user_id: 'user-1',
        role_name: RoleName.ADMIN,
        added_by: 'adder-1',
        joined_at: new Date(),
      } as any;

      mockAddWorkspaceMemberService.addMember.mockResolvedValue(mockModel);

      const result = await app.addMember('ws-1', mockDto, 'adder-1');

      expect(mockUow.runInTransaction).toHaveBeenCalled();
      expect(mockAddWorkspaceMemberService.addMember).toHaveBeenCalledWith(
        {
          workspace_id: 'ws-1',
          user_id: 'user-1',
          role_name: RoleName.ADMIN,
          added_by: 'adder-1',
        },
        'mockManager',
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
            roleName: RoleName.ADMIN,
          },
        },
        'mockManager',
      );

      // Verify basic mapping properties (depends on mapper implementation, checking structure here)
      expect(result).toHaveProperty('workspace_id', 'ws-1');
      expect(result).toHaveProperty('user_id', 'user-1');
    });
  });
});
