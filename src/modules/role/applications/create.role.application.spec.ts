import { Test, TestingModule } from '@nestjs/testing';
import { ROLE_TYPES } from '../interfaces/types';
import { CreateRoleApplicationImpl } from './create.role.application';

describe('CreateRoleApplicationImpl', () => {
  let app: CreateRoleApplicationImpl;

  const mockCreateRoleService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateRoleApplicationImpl,
        {
          provide: ROLE_TYPES.services.CreateRoleService,
          useValue: mockCreateRoleService,
        },
      ],
    }).compile();

    app = module.get<CreateRoleApplicationImpl>(CreateRoleApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('create', () => {
    it('should create role and map to response', async () => {
      const mockDto = { name: 'admin' } as any;
      const mockModel = { id: 'r-1', name: 'admin' } as any;

      mockCreateRoleService.create.mockResolvedValue(mockModel);

      const result = await app.create(mockDto);

      expect(mockCreateRoleService.create).toHaveBeenCalledWith(mockDto);
      expect(result).toHaveProperty('id', 'r-1');
    });
  });
});
