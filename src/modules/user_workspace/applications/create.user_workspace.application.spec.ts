import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { USER_WORKSPACE_TYPES } from '../interfaces/types';
import { CreateUserWorkspaceApplicationImpl } from './create.user_workspace.application';

describe('CreateUserWorkspaceApplicationImpl', () => {
  let app: CreateUserWorkspaceApplicationImpl;

  const mockCreateUserWorkspaceService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserWorkspaceApplicationImpl,
        {
          provide: USER_WORKSPACE_TYPES.services.CreateUserWorkspaceService,
          useValue: mockCreateUserWorkspaceService,
        },
      ],
    }).compile();

    app = module.get<CreateUserWorkspaceApplicationImpl>(
      CreateUserWorkspaceApplicationImpl,
    );
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create and map response', async () => {
      const mockDto = { workspace_id: 'ws-1', user_id: 'user-1', role_name: RoleName.ADMIN };
      const mockModel = { ...mockDto, joined_at: new Date() } as any;

      mockCreateUserWorkspaceService.create.mockResolvedValue(mockModel);

      const result = await app.create(mockDto);

      expect(mockCreateUserWorkspaceService.create).toHaveBeenCalledWith(mockDto);
      expect(result).toHaveProperty('workspace_id', 'ws-1');
      expect(result).toHaveProperty('user_id', 'user-1');
    });
  });
});
