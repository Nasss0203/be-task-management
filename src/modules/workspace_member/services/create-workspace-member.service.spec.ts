import { Test, TestingModule } from '@nestjs/testing';
import { WORKSPACE_MEMBER_TYPES } from '../interfaces/types';
import { CreateWorkspaceMemberServiceImpl } from './create-workspace-member.service';

describe('CreateWorkspaceMemberServiceImpl', () => {
  let service: CreateWorkspaceMemberServiceImpl;

  const mockRepository = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateWorkspaceMemberServiceImpl,
        {
          provide:
            WORKSPACE_MEMBER_TYPES.repositories.WorkspaceMemberRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CreateWorkspaceMemberServiceImpl>(
      CreateWorkspaceMemberServiceImpl,
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
