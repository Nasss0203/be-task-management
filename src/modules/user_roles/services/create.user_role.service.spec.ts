import { Test, TestingModule } from '@nestjs/testing';
import { USER_ROLE_TYPES } from '../interfaces/types';
import { CreateUserRoleServiceImpl } from './create.user_role.service';

describe('CreateUserRoleServiceImpl', () => {
  let service: CreateUserRoleServiceImpl;

  const mockUserRoleRepository = {
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserRoleServiceImpl,
        {
          provide: USER_ROLE_TYPES.repositories.UserRoleRepository,
          useValue: mockUserRoleRepository,
        },
      ],
    }).compile();

    service = module.get<CreateUserRoleServiceImpl>(CreateUserRoleServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should save and return user role', async () => {
      mockUserRoleRepository.save.mockResolvedValue({ id: 'ur-1' });
      const dto = {
        user_id: 'u-1',
        role_id: 'r-1',
        workspace_id: 'ws-1',
        assigned_by: 'a-1',
      };

      const result = await service.create(dto);

      expect(mockUserRoleRepository.save).toHaveBeenCalledWith(dto, undefined);
      expect(result).toEqual({ id: 'ur-1' });
    });
  });
});
