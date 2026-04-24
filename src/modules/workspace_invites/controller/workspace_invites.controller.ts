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
import { CreateWorkspaceInviteDto } from '../dto/create-workspace_invite.dto';
import { WorkspaceInviteResponseDto } from '../dto/response/workspace_invites-response.dto';
import { type AcceptWorkspaceInviteApplication } from '../interfaces/applications/accept-workspace-invite.application.interface';
import { type InviteWorkspaceMemberApplication } from '../interfaces/applications/invite-workspace-member.application.interface';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';
import { WorkspaceInvitesService } from '../workspace_invites.service';

@Controller('workspace-invites')
export class WorkspaceInvitesController {
  constructor(
    private readonly workspaceInvitesService: WorkspaceInvitesService,
    @Inject(
      WORKSPACE_INVITE_TYPES.applications.InviteWorkspaceMemberApplication,
    )
    private readonly inviteWorkspaceMemberApplication: InviteWorkspaceMemberApplication,

    @Inject(
      WORKSPACE_INVITE_TYPES.applications.AcceptWorkspaceInviteApplication,
    )
    private readonly acceptWorkspaceInviteApplication: AcceptWorkspaceInviteApplication,
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
}
