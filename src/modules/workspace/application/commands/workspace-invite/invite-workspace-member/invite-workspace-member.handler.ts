import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { type FindUserService } from 'src/modules/identity/application/ports/find-user.service.interface';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import { MailService } from 'src/modules/mail/mail.service';
import {
  NotificationSenderType,
  NotificationSourceType,
  NotificationType,
} from 'src/modules/notifications/domain/entities/notification.entity';
import { type CreateNotificationService } from 'src/modules/notifications/interfaces/services/create.notifications.service.interface';
import { NOTIFICATION_TYPES } from 'src/modules/notifications/interfaces/types';
import {
  CreateWorkspaceInviteDto,
  InviteRecipientDto,
  InviteRecipientType,
} from 'src/modules/workspace/application/dto/workspace-invite/create-workspace-invite.dto';
import { WorkspaceInviteResponseDto } from 'src/modules/workspace/application/dto/workspace-invite/response/workspace-invite.response.dto';
import { WorkspaceInvite } from 'src/modules/workspace/domain/aggregates/workspace-invite/workspace-invite.aggregate';
import { WorkspaceInviteStatus } from 'src/modules/workspace/domain/enums/workspace-invite-status.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import type { WorkspaceInviteRepository } from 'src/modules/workspace/domain/repositories/workspace-invite.repository';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { InviteWorkspaceMemberCommand } from './invite-workspace-member.command';

@Injectable()
export class InviteWorkspaceMemberHandler {
  private readonly logger = new Logger(InviteWorkspaceMemberHandler.name);

  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceInviteRepository)
    private readonly workspaceInviteRepository: WorkspaceInviteRepository,

    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,

    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepository: WorkspaceRepository,

    @Inject(IDENTITY_TYPES.services.FindUserService)
    private readonly findUserService: FindUserService,

    @Inject(NOTIFICATION_TYPES.services.CreateNotificationService)
    private readonly createNotificationService: CreateNotificationService,

    private readonly mailService: MailService,
  ) {}

  async execute(
    command: InviteWorkspaceMemberCommand,
  ): Promise<WorkspaceInviteResponseDto[]> {
    const { workspaceId, invitedBy, dto } = command;

    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    if (!invitedBy) {
      throw new BadRequestException('invitedBy is required');
    }

    if (!dto.role_name) {
      throw new BadRequestException('role_name is required');
    }

    await this.ensureCanInviteRole(workspaceId, invitedBy, dto.role_name);

    if (!dto.recipients || dto.recipients.length === 0) {
      throw new BadRequestException('recipients is required');
    }

    const [resolvedRecipients, workspace, inviterMember, inviterUser] =
      await Promise.all([
        this.resolveRecipients(dto.recipients),
        this.findWorkspaceForInviter(invitedBy, workspaceId),
        this.workspaceMemberRepository.findDetailByWorkspaceAndUser(
          workspaceId,
          invitedBy,
        ),
        this.findUserService.findUserById(invitedBy),
      ]);

    const workspaceName = workspace.getName();
    const inviterName =
      inviterUser?.username?.trim() ||
      inviterUser?.email?.trim() ||
      'Một thành viên';
    const inviterEmail =
      inviterMember?.getEmail() ?? inviterUser?.email ?? null;
    const acceptUrlBase =
      process.env.FRONTEND_URL?.replace(/\/$/, '') ||
      process.env.CLIENT_URL?.replace(/\/$/, '');

    if (!acceptUrlBase) {
      throw new HttpException(
        'FRONTEND_URL config is missing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const result: WorkspaceInviteResponseDto[] = [];

    for (const recipient of resolvedRecipients) {
      if (recipient.user_id && recipient.user_id === invitedBy) {
        throw new BadRequestException('You cannot invite yourself');
      }

      if (recipient.user_id) {
        const existingMember =
          await this.workspaceMemberRepository.findByWorkspaceAndUser(
            workspaceId,
            recipient.user_id,
          );
        if (existingMember) {
          throw new ConflictException(
            `User ${recipient.email} is already a member of this workspace`,
          );
        }
      }

      const existingInvite =
        await this.workspaceInviteRepository.findByWorkspaceAndEmail(
          workspaceId,
          recipient.email,
        );
      if (
        existingInvite &&
        existingInvite.getStatus() === WorkspaceInviteStatus.PENDING &&
        existingInvite.getExpiresAt() > new Date()
      ) {
        throw new ConflictException(
          `A pending invite for ${recipient.email} already exists`,
        );
      }

      const invite = await this.createEmailInvite(workspaceId, invitedBy, dto, {
        user_id: recipient.user_id,
        email: recipient.email,
      });

      if (recipient.user_id) {
        await this.createNotificationService.createNotification({
          receiverId: recipient.user_id,
          senderType: NotificationSenderType.USER,
          actorId: invitedBy,
          sourceType: NotificationSourceType.WORKSPACE,
          workspaceId,
          projectId: null,
          taskId: null,
          sprintId: null,
          commentId: null,
          type: NotificationType.WORKSPACE_INVITE,
          title: 'Workspace invitation',
          message: `${inviterName} invited you to join ${workspaceName}.`,
          actionUrl: `/invite/workspace?token=${invite.getToken()}`,
          metadata: {
            inviteId: invite.getId(),
            inviteToken: invite.getToken(),
            inviteStatus: invite.getStatus(),
            workspaceId,
            workspaceName,
            roleName: dto.role_name,
            invitedBy,
            inviterName,
            inviterEmail,
            email: recipient.email,
          },
        });
      }

      this.queueInviteEmail({
        to: recipient.email,
        workspaceName,
        inviterName,
        roleName: dto.role_name,
        acceptUrl: `${acceptUrlBase}/invite/workspace?token=${invite.getToken()}`,
      });

      result.push(WorkspaceInviteResponseDto.fromDomain(invite));
    }

    return result;
  }

  private async findWorkspaceForInviter(
    invitedBy: string,
    workspaceId: string,
  ) {
    const workspace = await this.workspaceRepository.findByUserIdAndWorkspaceId(
      invitedBy,
      workspaceId,
    );

    if (!workspace) {
      throw new HttpException('Workspace not found', HttpStatus.NOT_FOUND);
    }

    return workspace;
  }

  private async createEmailInvite(
    workspaceId: string,
    invitedBy: string,
    dto: CreateWorkspaceInviteDto,
    recipient: {
      user_id: string | null;
      email: string;
    },
  ) {
    if (!recipient.email || !recipient.email.trim()) {
      throw new BadRequestException('email is required');
    }

    return this.workspaceInviteRepository.save(
      WorkspaceInvite.createEmail({
        workspaceId,
        userId: recipient.user_id,
        email: recipient.email.trim().toLowerCase(),
        roleName: dto.role_name,
        invitedBy,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }),
    );
  }

  private queueInviteEmail(input: {
    to: string;
    workspaceName: string;
    inviterName: string;
    roleName: string;
    acceptUrl: string;
  }): void {
    void this.mailService.sendInviteMember(input).catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Unknown mail transport error';

      this.logger.warn(
        `Workspace invite email failed for ${input.to}: ${message}`,
      );
    });
  }

  private async resolveRecipients(recipients: InviteRecipientDto[]): Promise<
    {
      user_id: string | null;
      email: string;
    }[]
  > {
    const map = new Map<
      string,
      {
        user_id: string | null;
        email: string;
      }
    >();

    for (const recipient of recipients) {
      const resolved = await this.resolveRecipient(recipient);

      map.set(resolved.email.toLowerCase(), resolved);
    }

    return Array.from(map.values());
  }

  private async resolveRecipient(recipient: InviteRecipientDto): Promise<{
    user_id: string | null;
    email: string;
  }> {
    if (recipient.type === InviteRecipientType.USER) {
      if (!recipient.user_id) {
        throw new BadRequestException('user_id is required');
      }

      const user = await this.findUserService.findUserById(recipient.user_id);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        user_id: user.id,
        email: user.email.trim().toLowerCase(),
      };
    }

    if (recipient.type === InviteRecipientType.EMAIL) {
      if (!recipient.email) {
        throw new BadRequestException('email is required');
      }

      return {
        user_id: null,
        email: recipient.email.trim().toLowerCase(),
      };
    }

    throw new BadRequestException('Invalid recipient type');
  }

  private async ensureCanInviteRole(
    workspaceId: string,
    invitedBy: string,
    roleName: WorkspaceRole,
  ): Promise<void> {
    if (![WorkspaceRole.OWNER].includes(roleName)) return;

    const inviterMember =
      await this.workspaceMemberRepository.findByWorkspaceAndUser(
        workspaceId,
        invitedBy,
      );

    if (!inviterMember || inviterMember.getRole() !== WorkspaceRole.OWNER) {
      throw new ForbiddenException(
        'Only workspace owner can invite owner or admin members',
      );
    }
  }
}
