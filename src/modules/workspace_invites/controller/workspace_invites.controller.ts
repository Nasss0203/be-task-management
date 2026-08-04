import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import {
  InviteRateLimit,
  SearchRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
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
import { SearchInviteUserResponseDto } from '../dto/search-invite-user.response.dto';
import { type AcceptWorkspaceInviteApplication } from '../interfaces/applications/accept-workspace-invite.application.interface';
import { type DeclineWorkspaceInviteApplication } from '../interfaces/applications/decline-workspace-invite.application.interface';
import { type CreateWorkspaceInviteLinkApplication } from '../interfaces/applications/create-workspace-invite-link.application.interface';
import { type InviteWorkspaceMemberApplication } from '../interfaces/applications/invite-workspace-member.application.interface';
import { type SearchInviteUsersApplication } from '../interfaces/applications/search-invite-users.application.interface';
import { WORKSPACE_INVITE_TYPES } from '../interfaces/types';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';

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
      WORKSPACE_INVITE_TYPES.applications.DeclineWorkspaceInviteApplication,
    )
    private readonly declineWorkspaceInviteApplication: DeclineWorkspaceInviteApplication,

    @Inject(
      WORKSPACE_INVITE_TYPES.applications.CreateWorkspaceInviteLinkApplication,
    )
    private readonly createWorkspaceInviteLinkApplication: CreateWorkspaceInviteLinkApplication,

    @Inject(WORKSPACE_INVITE_TYPES.applications.SearchInviteUsersApplication)
    private readonly searchInviteUsersApplication: SearchInviteUsersApplication,
  ) {}

  @Post(':workspaceId/members')
  @InviteRateLimit()
  @ResponseMessage('Invite workspace members successfully')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.WORKSPACE_MEMBER_ADD)
  async invite(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateWorkspaceInviteDto,
    @Auth() auth: IAuth,
  ): Promise<WorkspaceInviteResponseDto[]> {
    const invitedBy = auth.id;

    if (!invitedBy) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.inviteWorkspaceMemberApplication.invite(
      workspaceId,
      invitedBy,
      dto,
    );
  }

  @Post(':token/accept')
  @InviteRateLimit()
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

  @Post(':token/decline')
  @InviteRateLimit()
  @ResponseMessage('Decline workspace invite successfully')
  async declineInvite(
    @Param('token') token: string,
    @Auth() auth: IAuth,
  ): Promise<WorkspaceInviteResponseDto> {
    if (!auth?.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (!auth?.email) {
      throw new UnauthorizedException('User email not found');
    }

    return this.declineWorkspaceInviteApplication.declineWorkspaceInvite({
      token,
      userId: auth.id,
      email: auth.email,
    });
  }

  @Post(':workspaceId/link')
  @InviteRateLimit()
  @ResponseMessage('Create workspace invite link successfully')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
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

  @Get(':workspaceId/users/search')
  @SearchRateLimit()
  @ResponseMessage('Search invite users successfully')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.WORKSPACE_MEMBER_ADD)
  async searchInviteUsers(
    @Param('workspaceId') workspaceId: string,
    @Query('q') q: string,
    @Auth() auth: IAuth,
  ): Promise<SearchInviteUserResponseDto[]> {
    if (!auth?.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.searchInviteUsersApplication.search({
      workspaceId,
      keyword: q,
      currentUserId: auth.id,
    });
  }
}
