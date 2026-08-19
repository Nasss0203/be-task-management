import { Test, TestingModule } from '@nestjs/testing';
import { AddWorkspaceMemberDto } from '../dto/workspace-member.dto';
import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';
import { type IAuth } from 'src/types/auth';
import { WorkspaceMemberController } from './workspace-member.controller';
import { AddWorkspaceMemberCommand } from '../application/commands/add-workspace-member/add-workspace-member.command';
import { AddWorkspaceMemberHandler } from '../application/commands/add-workspace-member/add-workspace-member.handler';
import { DeleteWorkspaceMemberCommand } from '../application/commands/delete-workspace-member/delete-workspace-member.command';
import { DeleteWorkspaceMemberHandler } from '../application/commands/delete-workspace-member/delete-workspace-member.handler';
import { UpdateWorkspaceMemberRoleHandler } from '../application/commands/update-workspace-member-role/update-workspace-member-role.handler';
import { ListWorkspaceMembersHandler } from '../application/queries/list-workspace-members/list-workspace-members.handler';
import { ListWorkspaceMembersQuery } from '../application/queries/list-workspace-members/list-workspace-members.query';

describe('WorkspaceMemberController', () => {
  let controller: WorkspaceMemberController;

  const createAuth = (id: string): IAuth => ({
    id,
    username: `${id}-username`,
    email: `${id}@example.com`,
    systemRole: SystemRole.USER,
  });

  const mockAddWorkspaceMemberHandler = {
    execute: jest.fn(),
  };

  const mockListWorkspaceMembersHandler = {
    execute: jest.fn(),
  };

  const mockUpdateWorkspaceMemberRoleHandler = {
    execute: jest.fn(),
  };

  const mockDeleteWorkspaceMemberHandler = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspaceMemberController],
      providers: [
        {
          provide: AddWorkspaceMemberHandler,
          useValue: mockAddWorkspaceMemberHandler,
        },
        {
          provide: UpdateWorkspaceMemberRoleHandler,
          useValue: mockUpdateWorkspaceMemberRoleHandler,
        },
        {
          provide: DeleteWorkspaceMemberHandler,
          useValue: mockDeleteWorkspaceMemberHandler,
        },
        {
          provide: ListWorkspaceMembersHandler,
          useValue: mockListWorkspaceMembersHandler,
        },
      ],
    }).compile();

    controller = module.get<WorkspaceMemberController>(
      WorkspaceMemberController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addMember', () => {
    it('should execute AddWorkspaceMemberCommand', async () => {
      mockAddWorkspaceMemberHandler.execute.mockResolvedValue({
        id: 'uw-1',
      });
      const dto: AddWorkspaceMemberDto = {
        user_id: 'user-1',
        role_name: WorkspaceRole.ADMIN,
      };
      const auth = createAuth('adder-1');

      const result = await controller.addMember('ws-1', dto, auth);

      expect(mockAddWorkspaceMemberHandler.execute).toHaveBeenCalledWith(
        new AddWorkspaceMemberCommand(
          'ws-1',
          'user-1',
          WorkspaceRole.ADMIN,
          'adder-1',
        ),
      );
      expect(result).toEqual({ id: 'uw-1' });
    });
  });

  describe('findAllMember', () => {
    it('should execute ListWorkspaceMembersQuery', async () => {
      mockListWorkspaceMembersHandler.execute.mockResolvedValue([
        { id: 'm-1' },
      ]);

      const result = await controller.findAllMember('ws-1');

      expect(mockListWorkspaceMembersHandler.execute).toHaveBeenCalledWith(
        new ListWorkspaceMembersQuery('ws-1'),
      );
      expect(result).toEqual([{ id: 'm-1' }]);
    });
  });

  describe('leaveWorkspace', () => {
    it('should remove the current user from the workspace', async () => {
      const auth = createAuth('user-1');

      await controller.leaveWorkspace('ws-1', auth);

      expect(mockDeleteWorkspaceMemberHandler.execute).toHaveBeenCalledWith(
        new DeleteWorkspaceMemberCommand('ws-1', 'user-1', 'user-1'),
      );
    });
  });
});
