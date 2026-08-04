import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { USER_WORKSPACE_TYPES } from '../interfaces/types';
import { FindMemberServiceImpl } from './find-user-workspace.service';

describe('FindMemberServiceImpl', () => {
  let service: FindMemberServiceImpl;

  const mockFindUserWorkspaceRepository = {
    findAllMember: jest.fn(),
    findMemberInWorkspace: jest.fn(),
  };

  const mockRepoUserworkspace = {
    find: jest.fn(), // unused in current implementation
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindMemberServiceImpl,
        {
          provide:
            USER_WORKSPACE_TYPES.repositories.FindUserWorkspaceRepository,
          useValue: mockFindUserWorkspaceRepository,
        },
        {
          provide: 'UserWorkspaceRepository',
          useValue: mockRepoUserworkspace,
        },
      ],
    }).compile();

    service = module.get<FindMemberServiceImpl>(FindMemberServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllMember', () => {
    it('should throw BadRequestException if workspaceId is missing', async () => {
      await expect(service.findAllMember('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return all members', async () => {
      mockFindUserWorkspaceRepository.findAllMember.mockResolvedValue([
        { id: 'm-1' },
      ]);

      const result = await service.findAllMember('ws-1');

      expect(
        mockFindUserWorkspaceRepository.findAllMember,
      ).toHaveBeenCalledWith('ws-1', undefined);
      expect(result).toEqual([{ id: 'm-1' }]);
    });
  });

  describe('findMemberInWorkspace', () => {
    it('should throw BadRequestException if workspaceId is missing', async () => {
      await expect(service.findMemberInWorkspace('', 'u-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if userId is missing', async () => {
      await expect(service.findMemberInWorkspace('ws-1', '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return member', async () => {
      mockFindUserWorkspaceRepository.findMemberInWorkspace.mockResolvedValue({
        id: 'm-1',
      });

      const result = await service.findMemberInWorkspace('ws-1', 'u-1');

      expect(
        mockFindUserWorkspaceRepository.findMemberInWorkspace,
      ).toHaveBeenCalledWith('ws-1', 'u-1', undefined);
      expect(result).toEqual({ id: 'm-1' });
    });
  });
});
