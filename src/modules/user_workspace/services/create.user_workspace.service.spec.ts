import { Test, TestingModule } from '@nestjs/testing';
import { USER_WORKSPACE_TYPES } from '../interfaces/types';
import { CreateUserWorkspaceServiceImpl } from './create.user_workspace.service';

describe('CreateUserWorkspaceServiceImpl', () => {
  let service: CreateUserWorkspaceServiceImpl;

  const mockRepository = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserWorkspaceServiceImpl,
        {
          provide: USER_WORKSPACE_TYPES.repositories.UserWorkspaceRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CreateUserWorkspaceServiceImpl>(
      CreateUserWorkspaceServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return user workspace', async () => {
      mockRepository.create.mockResolvedValue({ id: 'uw-1' });
      const dto = { workspace_id: 'ws-1', user_id: 'u-1' };

      const result = await service.create(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(dto, undefined);
      expect(result).toEqual({ id: 'uw-1' });
    });
  });
});
