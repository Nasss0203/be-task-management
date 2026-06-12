import { Test, TestingModule } from '@nestjs/testing';
import { CreateWorkspaceInviteServiceImpl } from './create.workspace_invites.service';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';
import { WorkspaceInviteType } from '../domain/entities/workspace_invite.entity';

describe('CreateWorkspaceInviteServiceImpl', () => {
  let service: CreateWorkspaceInviteServiceImpl;

  const mockRepo = {
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateWorkspaceInviteServiceImpl,
        { provide: WORKSPACE_INVITE_TYPES.repositories.CreateWorkspaceInviteRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CreateWorkspaceInviteServiceImpl>(CreateWorkspaceInviteServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create invite', async () => {
    mockRepo.save.mockResolvedValue({ id: 'inv-1' });
    const result = await service.save({ workspace_id: 'ws-1', type: WorkspaceInviteType.EMAIL, invited_by: 'u-1', email: 'test@example.com', role_name: 'MEMBER' } as any);
    expect(mockRepo.save).toHaveBeenCalled();
    expect(result.id).toEqual('inv-1');
  });
});
