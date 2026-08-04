import { Test, TestingModule } from '@nestjs/testing';
import { USER_TYPES } from '../interfaces/types';
import { FindUserServiceImpl } from './find-user.service';

describe('FindUserServiceImpl', () => {
  let service: FindUserServiceImpl;

  const mockFindUserRepository = {
    findUserByUsername: jest.fn(),
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    searchUsers: jest.fn(),
    searchInviteUsers: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindUserServiceImpl,
        {
          provide: USER_TYPES.repositories.FindUserRepository,
          useValue: mockFindUserRepository,
        },
      ],
    }).compile();

    service = module.get<FindUserServiceImpl>(FindUserServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findUserByUsername', () => {
    it('should return user by username', async () => {
      mockFindUserRepository.findUserByUsername.mockResolvedValue({
        id: 'u-1',
      });
      const result = await service.findUserByUsername('testuser');
      expect(mockFindUserRepository.findUserByUsername).toHaveBeenCalledWith(
        'testuser',
      );
      expect(result).toEqual({ id: 'u-1' });
    });
  });

  describe('findUserByEmail', () => {
    it('should return user by email', async () => {
      mockFindUserRepository.findUserByEmail.mockResolvedValue({ id: 'u-1' });
      const result = await service.findUserByEmail('test@test.com');
      expect(mockFindUserRepository.findUserByEmail).toHaveBeenCalledWith(
        'test@test.com',
      );
      expect(result).toEqual({ id: 'u-1' });
    });
  });

  describe('findUserById', () => {
    it('should return user by id', async () => {
      mockFindUserRepository.findUserById.mockResolvedValue({ id: 'u-1' });
      const result = await service.findUserById('u-1');
      expect(mockFindUserRepository.findUserById).toHaveBeenCalledWith('u-1');
      expect(result).toEqual({ id: 'u-1' });
    });
  });

  describe('searchUsers', () => {
    it('should return users', async () => {
      mockFindUserRepository.searchUsers.mockResolvedValue([{ id: 'u-1' }]);
      const result = await service.searchUsers('test');
      expect(mockFindUserRepository.searchUsers).toHaveBeenCalledWith('test');
      expect(result).toEqual([{ id: 'u-1' }]);
    });
  });

  describe('searchInviteUsers', () => {
    it('should return empty array if keyword is less than 2 chars', async () => {
      const result = await service.searchInviteUsers({
        keyword: 'a',
        workspaceId: 'ws-1',
        currentUserId: 'u-1',
      });
      expect(result).toEqual([]);
      expect(mockFindUserRepository.searchInviteUsers).not.toHaveBeenCalled();
    });

    it('should trim keyword and return empty if less than 2 chars', async () => {
      const result = await service.searchInviteUsers({
        keyword: ' a ',
        workspaceId: 'ws-1',
        currentUserId: 'u-1',
      });
      expect(result).toEqual([]);
      expect(mockFindUserRepository.searchInviteUsers).not.toHaveBeenCalled();
    });

    it('should return invite users if keyword is valid', async () => {
      mockFindUserRepository.searchInviteUsers.mockResolvedValue([
        { id: 'u-2' },
      ]);
      const result = await service.searchInviteUsers({
        keyword: 'test',
        workspaceId: 'ws-1',
        currentUserId: 'u-1',
      });
      expect(mockFindUserRepository.searchInviteUsers).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        keyword: 'test',
        currentUserId: 'u-1',
      });
      expect(result).toEqual([{ id: 'u-2' }]);
    });
  });
});
