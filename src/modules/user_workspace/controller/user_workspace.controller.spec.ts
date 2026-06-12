import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { UserWorkspacesController } from './user_workspace.controller';
import { USER_WORKSPACE_TYPES } from '../interfaces/types';
import { UserWorkspacesService } from '../user_workspace.service';

describe('UserWorkspacesController', () => {
  let controller: UserWorkspacesController;

  const mockAddWorkspaceMemberApplication = {
    addMember: jest.fn(),
  };

  const mockFindAllMemberApplication = {
    findAllMember: jest.fn(),
  };

  const mockUserWorkspacesService = {};

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserWorkspacesController],
      providers: [
        {
          provide: UserWorkspacesService,
          useValue: mockUserWorkspacesService,
        },
        {
          provide: USER_WORKSPACE_TYPES.applications.AddWorkspaceMemberApplication,
          useValue: mockAddWorkspaceMemberApplication,
        },
        {
          provide: USER_WORKSPACE_TYPES.applications.FindAllMemberApplication,
          useValue: mockFindAllMemberApplication,
        },
      ],
    }).compile();

    controller = module.get<UserWorkspacesController>(UserWorkspacesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addMember', () => {
    it('should call addMemberApp.addMember', async () => {
      mockAddWorkspaceMemberApplication.addMember.mockResolvedValue({ id: 'uw-1' });
      const dto = { user_id: 'user-1', role_name: RoleName.ADMIN } as any;
      const auth = { id: 'adder-1' } as any;

      const result = await controller.addMember('ws-1', dto, auth);

      expect(mockAddWorkspaceMemberApplication.addMember).toHaveBeenCalledWith('ws-1', dto, 'adder-1');
      expect(result).toEqual({ id: 'uw-1' });
    });
  });

  describe('findAllMember', () => {
    it('should call findAllMemberApp.findAllMember', async () => {
      mockFindAllMemberApplication.findAllMember.mockResolvedValue([{ id: 'm-1' }]);

      const result = await controller.findAllMember('ws-1');

      expect(mockFindAllMemberApplication.findAllMember).toHaveBeenCalledWith('ws-1');
      expect(result).toEqual([{ id: 'm-1' }]);
    });
  });
});
