import {
  Body,
  Controller,
  Inject,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';
import {
  AcceptWorkspaceInviteDto,
  CreateWorkspaceInviteDto,
} from '../dto/create-workspace_invite.dto';
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
    console.log('invitedBy', invitedBy);

    if (!invitedBy) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.inviteWorkspaceMemberApplication.invite(
      dto.workspaceId,
      invitedBy,
      dto,
    );
  }

  @Post('accept')
  @ResponseMessage('Accept workspace invite successfully')
  async acceptInvite(
    @Body() dto: AcceptWorkspaceInviteDto,
    @Auth() auth: IAuth,
  ): Promise<WorkspaceInviteResponseDto> {
    if (!auth?.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.acceptWorkspaceInviteApplication.acceptWorkspaceInvite(
      dto.token,
      auth.id,
    );
  }
}
