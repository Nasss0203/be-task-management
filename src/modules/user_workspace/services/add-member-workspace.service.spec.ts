import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { ROLE_TYPES } from 'src/modules/role/interfaces/types';
import { USER_ROLE_TYPES } from 'src/modules/user_roles/interfaces/types';
import { USER_WORKSPACE_TYPES } from '../interfaces/types';
import { AddMemberWorkspaceServiceImpl } from './add-member-workspace.service';

describe('AddMemberWorkspaceServiceImpl', () => {
  let service: AddMemberWorkspaceServiceImpl;

  const mockFindUserWorkspaceRepository = {
    findMemberInWorkspace: jest.fn(),
  };

  const mockUserWorkspaceRepository = {
    create: jest.fn(),
  };

  const mockFindRoleRepository = {
    findByNameAndWorkspace: jest.fn(),
  };

  const mockUserRoleRepository = {
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddMemberWorkspaceServiceImpl,
        {
          provide:
            USER_WORKSPACE_TYPES.repositories.FindUserWorkspaceRepository,
          useValue: mockFindUserWorkspaceRepository,
        },
        {
          provide: USER_WORKSPACE_TYPES.repositories.UserWorkspaceRepository,
          useValue: mockUserWorkspaceRepository,
        },
        {
          provide: ROLE_TYPES.repositories.FindRoleRepository,
          useValue: mockFindRoleRepository,
        },
        {
          provide: USER_ROLE_TYPES.repositories.UserRoleRepository,
          useValue: mockUserRoleRepository,
        },
      ],
    }).compile();

    service = module.get<AddMemberWorkspaceServiceImpl>(
      AddMemberWorkspaceServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addMember', () => {
    it('should throw ForbiddenException if trying to add admin/owner and not owner', async () => {
      mockFindUserWorkspaceRepository.findMemberInWorkspace.mockResolvedValueOnce(
        { role_name: RoleName.MEMBER },
      );

      await expect(
        service.addMember({
          workspace_id: 'ws-1',
          user_id: 'user-1',
          role_name: RoleName.ADMIN,
          added_by: 'adder-1',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if user is already in workspace', async () => {
      mockFindUserWorkspaceRepository.findMemberInWorkspace.mockResolvedValueOnce(
        { id: 'uw-1' },
      ); // existing check

      await expect(
        service.addMember({
          workspace_id: 'ws-1',
          user_id: 'user-1',
          role_name: RoleName.MEMBER,
          added_by: 'adder-1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if role not found', async () => {
      mockFindUserWorkspaceRepository.findMemberInWorkspace.mockResolvedValueOnce(
        null,
      ); // not exists
      mockUserWorkspaceRepository.create.mockResolvedValue({ id: 'uw-1' });
      mockFindRoleRepository.findByNameAndWorkspace.mockResolvedValue(null);

      await expect(
        service.addMember({
          workspace_id: 'ws-1',
          user_id: 'user-1',
          role_name: RoleName.MEMBER,
          added_by: 'adder-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create membership and role assignment successfully', async () => {
      mockFindUserWorkspaceRepository.findMemberInWorkspace.mockResolvedValueOnce(
        null,
      ); // not exists
      mockUserWorkspaceRepository.create.mockResolvedValue({ id: 'uw-1' });
      mockFindRoleRepository.findByNameAndWorkspace.mockResolvedValue({
        id: 'role-1',
      });

      const result = await service.addMember({
        workspace_id: 'ws-1',
        user_id: 'user-1',
        role_name: RoleName.MEMBER,
        added_by: 'adder-1',
      });

      expect(mockUserWorkspaceRepository.create).toHaveBeenCalledWith(
        { workspace_id: 'ws-1', user_id: 'user-1' },
        undefined,
      );
      expect(mockUserRoleRepository.save).toHaveBeenCalledWith(
        {
          workspace_id: 'ws-1',
          user_id: 'user-1',
          role_id: 'role-1',
          assigned_by: 'adder-1',
        },
        undefined,
      );
      expect(result).toEqual({ id: 'uw-1' });
    });
  });
});
