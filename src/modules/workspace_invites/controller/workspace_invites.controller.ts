import {
  Body,
  Controller,
  Inject,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';
import {
  CreateWorkspaceInviteDto,
  CreateWorkspaceInviteLinkDto,
} from '../dto/create-workspace_invite.dto';
import { WorkspaceInviteLinkResponseDto } from '../dto/response/workspace-invite-link-response.dto';
import { WorkspaceInviteResponseDto } from '../dto/response/workspace_invites-response.dto';
import { type AcceptWorkspaceInviteApplication } from '../interfaces/applications/accept-workspace-invite.application.interface';
import { type CreateWorkspaceInviteLinkApplication } from '../interfaces/applications/create-workspace-invite-link.application.interface';
import { type InviteWorkspaceMemberApplication } from '../interfaces/applications/invite-workspace-member.application.interface';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';

@Controller('workspace-invites')
export class WorkspaceInvitesController {
  constructor(
    @Inject(
      WORKSPACE_INVITE_TYPES.applications.InviteWorkspaceMemberApplication,
    )
    private readonly inviteWorkspaceMemberApplication: InviteWorkspaceMemberApplication,

    @Inject(
      WORKSPACE_INVITE_TYPES.applications.AcceptWorkspaceInviteApplication,
    )
    private readonly acceptWorkspaceInviteApplication: AcceptWorkspaceInviteApplication,

    @Inject(
      WORKSPACE_INVITE_TYPES.applications.CreateWorkspaceInviteLinkApplication,
    )
    private readonly createWorkspaceInviteLinkApplication: CreateWorkspaceInviteLinkApplication,
  ) {}

  @Post()
  @ResponseMessage('Invite workspace member successfully')
  @RequirePermissions(PERMISSIONS.WORKSPACE_MEMBER_ADD)
  async invite(
    @Body() dto: CreateWorkspaceInviteDto,
    @Auth() auth: IAuth,
  ): Promise<WorkspaceInviteResponseDto> {
    const invitedBy = auth.id;

    if (!invitedBy) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.inviteWorkspaceMemberApplication.invite(
      dto.workspaceId,
      invitedBy,
      dto,
    );
  }

  @Post(':token/accept')
  @ResponseMessage('Accept workspace invite successfully')
  async acceptInvite(
    @Param('token') token: string,
    @Auth() auth: IAuth,
  ): Promise<WorkspaceInviteResponseDto> {
    if (!auth?.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (!auth?.email) {
      throw new UnauthorizedException('User email not found');
    }

    return this.acceptWorkspaceInviteApplication.acceptWorkspaceInvite({
      token,
      userId: auth.id,
      email: auth.email,
    });
  }

  @Post(':workspaceId/link')
  @ResponseMessage('Create workspace invite link successfully')
  @RequirePermissions(PERMISSIONS.WORKSPACE_MEMBER_ADD)
  async createInviteLink(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateWorkspaceInviteLinkDto,
    @Auth() auth: IAuth,
  ): Promise<WorkspaceInviteLinkResponseDto> {
    const invitedBy = auth?.id;

    if (!invitedBy) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.createWorkspaceInviteLinkApplication.createLink(
      workspaceId,
      invitedBy,
      dto,
    );
  }
}
