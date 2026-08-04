import { Test, TestingModule } from '@nestjs/testing';
import { ROLE_PERMISSION_TYPES } from '../interfaces/types';
import { CreateRolePermissionServiceImpl } from './create-role_permission.service';

describe('CreateRolePermissionServiceImpl', () => {
  let service: CreateRolePermissionServiceImpl;

  const mockCreateRolePermissionRepository = {
    saveMany: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateRolePermissionServiceImpl,
        {
          provide:
            ROLE_PERMISSION_TYPES.repositories.CreateRolePermissionRepository,
          useValue: mockCreateRolePermissionRepository,
        },
      ],
    }).compile();

    service = module.get<CreateRolePermissionServiceImpl>(
      CreateRolePermissionServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMany', () => {
    it('should call saveMany on repo', async () => {
      const mockData = [
        { role_id: 'r-1', permission_id: 'p-1', granted_by: 'u-1' },
      ];
      await service.createMany(mockData);
      expect(mockCreateRolePermissionRepository.saveMany).toHaveBeenCalledWith(
        mockData,
        undefined,
      );
    });
  });
});
