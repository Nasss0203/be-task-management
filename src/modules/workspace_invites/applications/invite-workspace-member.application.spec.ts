import { Test, TestingModule } from '@nestjs/testing';
import { InviteWorkspaceMemberApplicationImpl } from './invite-workspace-member.application';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';
import { USER_TYPES } from 'src/modules/users/interfaces/types';
import { NOTIFICATION_TYPES } from 'src/modules/notifications/interfaces/types';
import { WORKSPACE_MEMBER_TYPES } from 'src/modules/workspace_member/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { MailService } from 'src/modules/mail/mail.service';
import { BadRequestException } from '@nestjs/common';
import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';
import {
  CreateWorkspaceInviteDto,
  InviteRecipientType,
} from '../dto/create-workspace_invite.dto';

describe('InviteWorkspaceMemberApplicationImpl', () => {
  let app: InviteWorkspaceMemberApplicationImpl;

  const mockCreateInvite = { save: jest.fn() };
  const mockFindUser = { findUserById: jest.fn() };
  const mockCreateNotification = { createNotification: jest.fn() };
  const mockFindMember = { findMemberInWorkspace: jest.fn() };
  const mockFindWorkspace = { findOneByWorkspaceId: jest.fn() };
  const mockMail = { sendInviteMember: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCreateNotification.createNotification.mockResolvedValue({});
    mockFindMember.findMemberInWorkspace.mockResolvedValue(null);
    mockFindWorkspace.findOneByWorkspaceId.mockResolvedValue({
      name: 'Task Management',
    });
    mockMail.sendInviteMember.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InviteWorkspaceMemberApplicationImpl,
        {
          provide: WORKSPACE_INVITE_TYPES.services.CreateWorkspaceInviteService,
          useValue: mockCreateInvite,
        },
        {
          provide: USER_TYPES.services.FindUserService,
          useValue: mockFindUser,
        },
        {
          provide: NOTIFICATION_TYPES.services.CreateNotificationService,
          useValue: mockCreateNotification,
        },
        {
          provide: WORKSPACE_MEMBER_TYPES.services.FindWorkspaceMemberService,
          useValue: mockFindMember,
        },
        {
          provide: WORKSPACE_TYPES.services.FindWorkspaceService,
          useValue: mockFindWorkspace,
        },
        { provide: MailService, useValue: mockMail },
      ],
    }).compile();

    app = module.get<InviteWorkspaceMemberApplicationImpl>(
      InviteWorkspaceMemberApplicationImpl,
    );
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should invite user', async () => {
    mockFindUser.findUserById
      .mockResolvedValueOnce({
        id: 'u-1',
        email: 'test@example.com',
      })
      .mockResolvedValueOnce({
        id: 'inviter-1',
        email: 'inviter@example.com',
        username: 'nass',
      });
    mockFindMember.findMemberInWorkspace.mockResolvedValue({
      full_name: 'Nass',
      email: 'inviter@example.com',
    });
    mockFindWorkspace.findOneByWorkspaceId.mockResolvedValue({
      name: 'Product Team',
    });
    mockCreateInvite.save.mockResolvedValue({ id: 'inv-1', token: 'tok-1' });
    mockMail.sendInviteMember.mockResolvedValue(undefined);

    const dto: CreateWorkspaceInviteDto = {
      role_name: WorkspaceRole.MEMBER,
      recipients: [{ type: InviteRecipientType.USER, user_id: 'u-1' }],
    };

    const result = await app.invite('ws-1', 'inviter-1', dto);
    expect(mockCreateInvite.save).toHaveBeenCalled();
    const notificationCalls = mockCreateNotification.createNotification.mock
      .calls as unknown[][];
    const notificationInput = notificationCalls[0]?.[0];

    expect(notificationInput).toMatchObject({
      message: 'Nass invited you to join Product Team.',
      metadata: {
        workspaceName: 'Product Team',
        inviterName: 'Nass',
        inviterEmail: 'inviter@example.com',
      },
    });
    expect(mockMail.sendInviteMember).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceName: 'Product Team',
        inviterName: 'Nass',
      }),
    );
    expect(result).toHaveLength(1);
  });

  it('should not fail the invite when email sending fails', async () => {
    mockFindUser.findUserById
      .mockResolvedValueOnce({
        id: 'u-1',
        email: 'test@example.com',
      })
      .mockResolvedValueOnce({
        id: 'inviter-1',
        email: 'inviter@example.com',
        username: 'nass',
      });
    mockFindMember.findMemberInWorkspace.mockResolvedValue({
      full_name: 'Nass',
      email: 'inviter@example.com',
    });
    mockFindWorkspace.findOneByWorkspaceId.mockResolvedValue({
      name: 'Product Team',
    });
    mockCreateInvite.save.mockResolvedValue({ id: 'inv-1', token: 'tok-1' });
    mockMail.sendInviteMember.mockRejectedValue(new Error('SMTP timeout'));

    const dto: CreateWorkspaceInviteDto = {
      role_name: WorkspaceRole.MEMBER,
      recipients: [{ type: InviteRecipientType.USER, user_id: 'u-1' }],
    };

    await expect(app.invite('ws-1', 'inviter-1', dto)).resolves.toHaveLength(1);
  });

  it('should throw if workspaceId missing', async () => {
    const dto: CreateWorkspaceInviteDto = {
      role_name: WorkspaceRole.MEMBER,
      recipients: [{ type: InviteRecipientType.USER, user_id: 'u-1' }],
    };

    await expect(app.invite('', 'inviter-1', dto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw if recipient invites themselves', async () => {
    mockFindUser.findUserById.mockResolvedValue({
      id: 'inviter-1',
      email: 'test@example.com',
    });
    const dto: CreateWorkspaceInviteDto = {
      role_name: WorkspaceRole.MEMBER,
      recipients: [{ type: InviteRecipientType.USER, user_id: 'inviter-1' }],
    };

    await expect(app.invite('ws-1', 'inviter-1', dto)).rejects.toThrow(
      BadRequestException,
    );
  });
});
