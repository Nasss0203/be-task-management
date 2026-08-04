import { Test, TestingModule } from '@nestjs/testing';
import { FindWorkspaceInviteServiceImpl } from './find-workspace-invite.service';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';

describe('FindWorkspaceInviteServiceImpl', () => {
  let service: FindWorkspaceInviteServiceImpl;

  const mockRepo = {
    findByToken: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindWorkspaceInviteServiceImpl,
        {
          provide:
            WORKSPACE_INVITE_TYPES.repositories.FindWorkspaceInviteRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<FindWorkspaceInviteServiceImpl>(
      FindWorkspaceInviteServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find by token', async () => {
    mockRepo.findByToken.mockResolvedValue({ id: 'inv-1' });
    const result = await service.findByToken('tok-1');
    expect(mockRepo.findByToken).toHaveBeenCalledWith('tok-1', undefined);
    expect(result).toEqual({ id: 'inv-1' });
  });
});
