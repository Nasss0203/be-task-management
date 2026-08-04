import { Test, TestingModule } from '@nestjs/testing';
import { InviteWorkspaceMemberApplicationImpl } from './invite-workspace-member.application';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';
import { USER_TYPES } from 'src/modules/users/interfaces/types';
import { NOTIFICATION_TYPES } from 'src/modules/notifications/interfaces/types';
import { USER_WORKSPACE_TYPES } from 'src/modules/user_workspace/interfaces/types';
import { MailService } from 'src/modules/mail/mail.service';
import { BadRequestException } from '@nestjs/common';
import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { InviteRecipientType } from '../dto/create-workspace_invite.dto';

describe('InviteWorkspaceMemberApplicationImpl', () => {
  let app: InviteWorkspaceMemberApplicationImpl;

  const mockCreateInvite = { save: jest.fn() };
  const mockFindUser = { findUserById: jest.fn() };
  const mockCreateNotification = { createNotification: jest.fn() };
  const mockFindMember = { findMemberInWorkspace: jest.fn() };
  const mockMail = { sendEmailTemplates: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
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
          provide: USER_WORKSPACE_TYPES.services.FindMemberService,
          useValue: mockFindMember,
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
    mockFindUser.findUserById.mockResolvedValue({
      id: 'u-1',
      email: 'test@example.com',
    });
    mockCreateInvite.save.mockResolvedValue({ id: 'inv-1', token: 'tok-1' });

    const dto = {
      role_name: RoleName.MEMBER,
      recipients: [{ type: InviteRecipientType.USER, user_id: 'u-1' }],
    } as any;

    const result = await app.invite('ws-1', 'inviter-1', dto);
    expect(mockCreateInvite.save).toHaveBeenCalled();
    expect(mockMail.sendEmailTemplates).toHaveBeenCalled();
  });

  it('should throw if workspaceId missing', async () => {
    await expect(
      app.invite('', 'inviter-1', { role_name: RoleName.MEMBER } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw if recipient invites themselves', async () => {
    mockFindUser.findUserById.mockResolvedValue({
      id: 'inviter-1',
      email: 'test@example.com',
    });
    const dto = {
      role_name: RoleName.MEMBER,
      recipients: [{ type: InviteRecipientType.USER, user_id: 'inviter-1' }],
    } as any;

    await expect(app.invite('ws-1', 'inviter-1', dto)).rejects.toThrow(
      BadRequestException,
    );
  });
});
