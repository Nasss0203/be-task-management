import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceInviteController } from './workspace-invite.controller';
import { InviteWorkspaceMemberCommand } from 'src/modules/workspace/application/commands/workspace-invite/invite-workspace-member/invite-workspace-member.command';
import { InviteWorkspaceMemberHandler } from 'src/modules/workspace/application/commands/workspace-invite/invite-workspace-member/invite-workspace-member.handler';
import { AcceptWorkspaceInviteHandler } from 'src/modules/workspace/application/commands/workspace-invite/accept-workspace-invite/accept-workspace-invite.handler';
import { CreateWorkspaceInviteLinkHandler } from 'src/modules/workspace/application/commands/workspace-invite/create-workspace-invite-link/create-workspace-invite-link.handler';
import { DeclineWorkspaceInviteHandler } from 'src/modules/workspace/application/commands/workspace-invite/decline-workspace-invite/decline-workspace-invite.handler';
import { SearchInviteUsersHandler } from 'src/modules/workspace/application/queries/workspace-invite/search-invite-users/search-invite-users.handler';
import { RevokeWorkspaceInviteHandler } from 'src/modules/workspace/application/commands/workspace-invite/revoke-workspace-invite/revoke-workspace-invite.handler';
import { ResendWorkspaceInviteHandler } from 'src/modules/workspace/application/commands/workspace-invite/resend-workspace-invite/resend-workspace-invite.handler';

describe('WorkspaceInviteController', () => {
  let controller: WorkspaceInviteController;

  const mockCreateLinkHandler = { execute: jest.fn() };
  const mockInviteHandler = { execute: jest.fn() };
  const mockSearchHandler = { execute: jest.fn() };
  const mockAcceptHandler = { execute: jest.fn() };
  const mockDeclineHandler = { execute: jest.fn() };
  const mockRevokeHandler = { execute: jest.fn() };
  const mockResendHandler = { execute: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspaceInviteController],
      providers: [
        {
          provide: CreateWorkspaceInviteLinkHandler,
          useValue: mockCreateLinkHandler,
        },
        {
          provide: InviteWorkspaceMemberHandler,
          useValue: mockInviteHandler,
        },
        {
          provide: SearchInviteUsersHandler,
          useValue: mockSearchHandler,
        },
        {
          provide: AcceptWorkspaceInviteHandler,
          useValue: mockAcceptHandler,
        },
        {
          provide: DeclineWorkspaceInviteHandler,
          useValue: mockDeclineHandler,
        },
        {
          provide: RevokeWorkspaceInviteHandler,
          useValue: mockRevokeHandler,
        },
        {
          provide: ResendWorkspaceInviteHandler,
          useValue: mockResendHandler,
        },
      ],
    }).compile();

    controller = module.get<WorkspaceInviteController>(
      WorkspaceInviteController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should invite user', async () => {
    mockInviteHandler.execute.mockResolvedValue([{ id: 'inv-1' }]);
    const result = await controller.invite(
      'ws-1',
      { role_name: 'MEMBER' } as any,
      { id: 'u-1' } as any,
    );
    expect(mockInviteHandler.execute).toHaveBeenCalledWith(
      new InviteWorkspaceMemberCommand('ws-1', 'u-1', {
        role_name: 'MEMBER',
      } as any),
    );
    expect(result).toEqual([{ id: 'inv-1' }]);
  });
});
