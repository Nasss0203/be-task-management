import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceInvitesController } from './workspace_invites.controller';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';

describe('WorkspaceInvitesController', () => {
  let controller: WorkspaceInvitesController;

  const mockCreateLinkApp = { createLink: jest.fn() };
  const mockInviteApp = { invite: jest.fn() };
  const mockSearchApp = { search: jest.fn() };
  const mockAcceptApp = { acceptWorkspaceInvite: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspaceInvitesController],
      providers: [
        { provide: WORKSPACE_INVITE_TYPES.applications.CreateWorkspaceInviteLinkApplication, useValue: mockCreateLinkApp },
        { provide: WORKSPACE_INVITE_TYPES.applications.InviteWorkspaceMemberApplication, useValue: mockInviteApp },
        { provide: WORKSPACE_INVITE_TYPES.applications.SearchInviteUsersApplication, useValue: mockSearchApp },
        { provide: WORKSPACE_INVITE_TYPES.applications.AcceptWorkspaceInviteApplication, useValue: mockAcceptApp },
      ],
    }).compile();

    controller = module.get<WorkspaceInvitesController>(WorkspaceInvitesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should invite user', async () => {
    mockInviteApp.invite.mockResolvedValue([{ id: 'inv-1' }]);
    const result = await controller.invite('ws-1', { role_name: 'MEMBER' } as any, { id: 'u-1' } as any);
    expect(mockInviteApp.invite).toHaveBeenCalledWith('ws-1', 'u-1', { role_name: 'MEMBER' });
    expect(result).toEqual([{ id: 'inv-1' }]);
  });
});
