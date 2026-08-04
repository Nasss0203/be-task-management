import { Test, TestingModule } from '@nestjs/testing';
import { ROLE_TYPES } from '../interfaces/types';
import { CreateRoleServiceImpl } from './create.role.service';

describe('CreateRoleServiceImpl', () => {
  let service: CreateRoleServiceImpl;

  const mockRoleRepo = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateRoleServiceImpl,
        {
          provide: ROLE_TYPES.repositories.RoleRepository,
          useValue: mockRoleRepo,
        },
      ],
    }).compile();

    service = module.get<CreateRoleServiceImpl>(CreateRoleServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw method not implemented error', async () => {
      await expect(service.create({} as any)).rejects.toThrow(
        'Method not implemented.',
      );
    });
  });
});
