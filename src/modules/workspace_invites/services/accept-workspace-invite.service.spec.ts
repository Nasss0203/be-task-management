import { Test, TestingModule } from '@nestjs/testing';
import { AcceptWorkspaceInviteServiceImpl } from './accept-workspace-invite.service';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';

describe('AcceptWorkspaceInviteServiceImpl', () => {
  let service: AcceptWorkspaceInviteServiceImpl;

  const mockRepo = {
    acceptWorkspaceInvite: jest.fn(),
  };

  const mockFindRepo = {
    findByToken: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcceptWorkspaceInviteServiceImpl,
        { provide: WORKSPACE_INVITE_TYPES.repositories.AcceptWorkspaceInviteRepository, useValue: mockRepo },
        { provide: WORKSPACE_INVITE_TYPES.repositories.FindWorkspaceInviteRepository, useValue: mockFindRepo },
      ],
    }).compile();

    service = module.get<AcceptWorkspaceInviteServiceImpl>(AcceptWorkspaceInviteServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should accept invite', async () => {
    mockFindRepo.findByToken.mockResolvedValue({ status: 'PENDING', type: 'LINK' });
    mockRepo.acceptWorkspaceInvite.mockResolvedValue({ id: 'inv-1' });
    const result = await service.acceptWorkspaceInvite({ token: 'tok-1', userId: 'u-1' });
    expect(mockRepo.acceptWorkspaceInvite).toHaveBeenCalledWith({ token: 'tok-1', userId: 'u-1' }, undefined);
    expect(result).toEqual({ id: 'inv-1' });
  });
});
