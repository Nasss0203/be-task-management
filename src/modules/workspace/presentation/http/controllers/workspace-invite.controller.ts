import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
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
} from 'src/modules/workspace/application/dto/workspace-invite/create-workspace-invite.dto';
import { WorkspaceInviteLinkResponseDto } from 'src/modules/workspace/application/dto/workspace-invite/response/workspace-invite-link-response.dto';
import { WorkspaceInviteResponseDto } from 'src/modules/workspace/application/dto/workspace-invite/response/workspace-invite.response.dto';
import { SearchInviteUserResponseDto } from 'src/modules/workspace/application/dto/workspace-invite/search-invite-user.response.dto';
import { AcceptWorkspaceInviteCommand } from 'src/modules/workspace/application/commands/workspace-invite/accept-workspace-invite/accept-workspace-invite.command';
import { AcceptWorkspaceInviteHandler } from 'src/modules/workspace/application/commands/workspace-invite/accept-workspace-invite/accept-workspace-invite.handler';
import { CreateWorkspaceInviteLinkCommand } from 'src/modules/workspace/application/commands/workspace-invite/create-workspace-invite-link/create-workspace-invite-link.command';
import { CreateWorkspaceInviteLinkHandler } from 'src/modules/workspace/application/commands/workspace-invite/create-workspace-invite-link/create-workspace-invite-link.handler';
import { DeclineWorkspaceInviteCommand } from 'src/modules/workspace/application/commands/workspace-invite/decline-workspace-invite/decline-workspace-invite.command';
import { DeclineWorkspaceInviteHandler } from 'src/modules/workspace/application/commands/workspace-invite/decline-workspace-invite/decline-workspace-invite.handler';
import { InviteWorkspaceMemberCommand } from 'src/modules/workspace/application/commands/workspace-invite/invite-workspace-member/invite-workspace-member.command';
import { InviteWorkspaceMemberHandler } from 'src/modules/workspace/application/commands/workspace-invite/invite-workspace-member/invite-workspace-member.handler';
import { SearchInviteUsersHandler } from 'src/modules/workspace/application/queries/workspace-invite/search-invite-users/search-invite-users.handler';
import { SearchInviteUsersQuery } from 'src/modules/workspace/application/queries/workspace-invite/search-invite-users/search-invite-users.query';
import { RevokeWorkspaceInviteCommand } from 'src/modules/workspace/application/commands/workspace-invite/revoke-workspace-invite/revoke-workspace-invite.command';
import { RevokeWorkspaceInviteHandler } from 'src/modules/workspace/application/commands/workspace-invite/revoke-workspace-invite/revoke-workspace-invite.handler';
import { ResendWorkspaceInviteCommand } from 'src/modules/workspace/application/commands/workspace-invite/resend-workspace-invite/resend-workspace-invite.command';
import { ResendWorkspaceInviteHandler } from 'src/modules/workspace/application/commands/workspace-invite/resend-workspace-invite/resend-workspace-invite.handler';
@Controller('workspace-invites')
export class WorkspaceInviteController {
  constructor(
    private readonly inviteWorkspaceMemberHandler: InviteWorkspaceMemberHandler,
    private readonly acceptWorkspaceInviteHandler: AcceptWorkspaceInviteHandler,
    private readonly declineWorkspaceInviteHandler: DeclineWorkspaceInviteHandler,
    private readonly createWorkspaceInviteLinkHandler: CreateWorkspaceInviteLinkHandler,
    private readonly searchInviteUsersHandler: SearchInviteUsersHandler,
    private readonly revokeWorkspaceInviteHandler: RevokeWorkspaceInviteHandler,
    private readonly resendWorkspaceInviteHandler: ResendWorkspaceInviteHandler,
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

    return this.inviteWorkspaceMemberHandler.execute(
      new InviteWorkspaceMemberCommand(workspaceId, invitedBy, dto),
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

    return this.acceptWorkspaceInviteHandler.execute(
      new AcceptWorkspaceInviteCommand(token, auth.id, auth.email),
    );
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

    return this.declineWorkspaceInviteHandler.execute(
      new DeclineWorkspaceInviteCommand(token, auth.id, auth.email),
    );
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

    return this.createWorkspaceInviteLinkHandler.execute(
      new CreateWorkspaceInviteLinkCommand(workspaceId, invitedBy, dto),
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

    return this.searchInviteUsersHandler.execute(
      new SearchInviteUsersQuery(workspaceId, q, auth.id),
    );
  }

  @Post(':workspaceId/invites/:inviteId/revoke')
  @InviteRateLimit()
  @ResponseMessage('Revoke workspace invite successfully')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.WORKSPACE_MEMBER_ADD)
  async revokeInvite(
    @Param('workspaceId') workspaceId: string,
    @Param('inviteId') inviteId: string,
    @Auth() auth: IAuth,
  ): Promise<WorkspaceInviteResponseDto> {
    if (!auth?.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.revokeWorkspaceInviteHandler.execute(
      new RevokeWorkspaceInviteCommand(inviteId, auth.id, workspaceId),
    );
  }

  @Post(':workspaceId/invites/:inviteId/resend')
  @InviteRateLimit()
  @ResponseMessage('Resend workspace invite successfully')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.WORKSPACE_MEMBER_ADD)
  async resendInvite(
    @Param('workspaceId') workspaceId: string,
    @Param('inviteId') inviteId: string,
    @Auth() auth: IAuth,
  ): Promise<WorkspaceInviteResponseDto> {
    if (!auth?.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.resendWorkspaceInviteHandler.execute(
      new ResendWorkspaceInviteCommand(inviteId, auth.id, workspaceId),
    );
  }
}
