import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '../domain/entities/role.entity';
import { ROLE_TYPES } from '../interfaces/types';
import { FindRoleServiceImpl } from './find-role.service';

describe('FindRoleServiceImpl', () => {
  let service: FindRoleServiceImpl;

  const mockFindRoleRepository = {
    findByNameAndWorkspace: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindRoleServiceImpl,
        {
          provide: ROLE_TYPES.repositories.FindRoleRepository,
          useValue: mockFindRoleRepository,
        },
      ],
    }).compile();

    service = module.get<FindRoleServiceImpl>(FindRoleServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByNameAndWorkspace', () => {
    it('should return role model', async () => {
      mockFindRoleRepository.findByNameAndWorkspace.mockResolvedValue({
        id: 'r-1',
      });

      const result = await service.findByNameAndWorkspace(
        RoleName.ADMIN,
        'ws-1',
      );

      expect(
        mockFindRoleRepository.findByNameAndWorkspace,
      ).toHaveBeenCalledWith(RoleName.ADMIN, 'ws-1', undefined);
      expect(result).toEqual({ id: 'r-1' });
    });
  });
});
