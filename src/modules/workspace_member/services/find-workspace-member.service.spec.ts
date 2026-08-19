import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WORKSPACE_MEMBER_TYPES } from '../interfaces/types';
import { FindWorkspaceMemberServiceImpl } from './find-workspace-member.service';

describe('FindWorkspaceMemberServiceImpl', () => {
  let service: FindWorkspaceMemberServiceImpl;

  const mockFindWorkspaceMemberRepository = {
    findAllMember: jest.fn(),
    findMemberInWorkspace: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindWorkspaceMemberServiceImpl,
        {
          provide:
            WORKSPACE_MEMBER_TYPES.repositories.FindWorkspaceMemberRepository,
          useValue: mockFindWorkspaceMemberRepository,
        },
      ],
    }).compile();

    service = module.get<FindWorkspaceMemberServiceImpl>(
      FindWorkspaceMemberServiceImpl,
    );
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
      mockFindWorkspaceMemberRepository.findAllMember.mockResolvedValue([
        { id: 'm-1' },
      ]);

      const result = await service.findAllMember('ws-1');

      expect(
        mockFindWorkspaceMemberRepository.findAllMember,
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
      mockFindWorkspaceMemberRepository.findMemberInWorkspace.mockResolvedValue(
        {
          id: 'm-1',
        },
      );

      const result = await service.findMemberInWorkspace('ws-1', 'u-1');

      expect(
        mockFindWorkspaceMemberRepository.findMemberInWorkspace,
      ).toHaveBeenCalledWith('ws-1', 'u-1', undefined);
      expect(result).toEqual({ id: 'm-1' });
    });
  });
});
