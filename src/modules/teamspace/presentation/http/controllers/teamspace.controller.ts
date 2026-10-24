import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { InviteRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { AddTeamspaceMemberCommand } from 'src/modules/teamspace/application/commands/teamspace/add-teamspace-member/add-teamspace-member.command';
import { AddTeamspaceMemberHandler } from 'src/modules/teamspace/application/commands/teamspace/add-teamspace-member/add-teamspace-member.handler';
import { AcceptTeamspaceInvitationCommand } from 'src/modules/teamspace/application/commands/teamspace/accept-teamspace-invitation/accept-teamspace-invitation.command';
import { AcceptTeamspaceInvitationHandler } from 'src/modules/teamspace/application/commands/teamspace/accept-teamspace-invitation/accept-teamspace-invitation.handler';

import { CreateTeamspaceCommand } from 'src/modules/teamspace/application/commands/teamspace/create-teamspace/create-teamspace.command';
import { CreateTeamspaceHandler } from 'src/modules/teamspace/application/commands/teamspace/create-teamspace/create-teamspace.handler';
import { CreateTeamspaceInviteLinkCommand } from 'src/modules/teamspace/application/commands/teamspace/create-teamspace-invite-link/create-teamspace-invite-link.command';
import { CreateTeamspaceInviteLinkHandler } from 'src/modules/teamspace/application/commands/teamspace/create-teamspace-invite-link/create-teamspace-invite-link.handler';
import { DeclineTeamspaceInvitationCommand } from 'src/modules/teamspace/application/commands/teamspace/decline-teamspace-invitation/decline-teamspace-invitation.command';
import { DeclineTeamspaceInvitationHandler } from 'src/modules/teamspace/application/commands/teamspace/decline-teamspace-invitation/decline-teamspace-invitation.handler';
import { ResendTeamspaceInvitationCommand } from 'src/modules/teamspace/application/commands/teamspace/resend-teamspace-invitation/resend-teamspace-invitation.command';
import { ResendTeamspaceInvitationHandler } from 'src/modules/teamspace/application/commands/teamspace/resend-teamspace-invitation/resend-teamspace-invitation.handler';
import { RevokeTeamspaceInvitationCommand } from 'src/modules/teamspace/application/commands/teamspace/revoke-teamspace-invitation/revoke-teamspace-invitation.command';
import { RevokeTeamspaceInvitationHandler } from 'src/modules/teamspace/application/commands/teamspace/revoke-teamspace-invitation/revoke-teamspace-invitation.handler';
import { InviteTeamspaceMemberCommand } from 'src/modules/teamspace/application/commands/teamspace/invite-teamspace-member/invite-teamspace-member.command';
import { InviteTeamspaceMemberHandler } from 'src/modules/teamspace/application/commands/teamspace/invite-teamspace-member/invite-teamspace-member.handler';
import { JoinTeamspaceByLinkCommand } from 'src/modules/teamspace/application/commands/teamspace/join-teamspace-by-link/join-teamspace-by-link.command';
import { JoinTeamspaceByLinkHandler } from 'src/modules/teamspace/application/commands/teamspace/join-teamspace-by-link/join-teamspace-by-link.handler';
import { JoinTeamspaceCommand } from 'src/modules/teamspace/application/commands/teamspace/join-teamspace/join-teamspace.command';
import { JoinTeamspaceHandler } from 'src/modules/teamspace/application/commands/teamspace/join-teamspace/join-teamspace.handler';
import { LeaveTeamspaceCommand } from 'src/modules/teamspace/application/commands/teamspace/leave-teamspace/leave-teamspace.command';
import { LeaveTeamspaceHandler } from 'src/modules/teamspace/application/commands/teamspace/leave-teamspace/leave-teamspace.handler';
import { RemoveTeamspaceMemberCommand } from 'src/modules/teamspace/application/commands/teamspace/remove-teamspace-member/remove-teamspace-member.command';
import { RemoveTeamspaceMemberHandler } from 'src/modules/teamspace/application/commands/teamspace/remove-teamspace-member/remove-teamspace-member.handler';
import { RevokeTeamspaceInviteLinkCommand } from 'src/modules/teamspace/application/commands/teamspace/revoke-teamspace-invite-link/revoke-teamspace-invite-link.command';
import { RevokeTeamspaceInviteLinkHandler } from 'src/modules/teamspace/application/commands/teamspace/revoke-teamspace-invite-link/revoke-teamspace-invite-link.handler';
import { UpdateTeamspaceMemberRoleCommand } from 'src/modules/teamspace/application/commands/teamspace/update-teamspace-member-role/update-teamspace-member-role.command';
import { UpdateTeamspaceMemberRoleHandler } from 'src/modules/teamspace/application/commands/teamspace/update-teamspace-member-role/update-teamspace-member-role.handler';
import { UpdateTeamspaceJoinSettingsCommand } from 'src/modules/teamspace/application/commands/teamspace/update-teamspace-join-settings/update-teamspace-join-settings.command';
import { UpdateTeamspaceJoinSettingsHandler } from 'src/modules/teamspace/application/commands/teamspace/update-teamspace-join-settings/update-teamspace-join-settings.handler';
import { AddTeamspaceMemberDto } from 'src/modules/teamspace/application/dto/teamspace/add-teamspace-member.dto';
import { CreateTeamspaceDto } from 'src/modules/teamspace/application/dto/teamspace/create-teamspace.dto';
import { CreateTeamspaceInviteLinkDto } from 'src/modules/teamspace/application/dto/teamspace/create-teamspace-invite-link.dto';
import { DiscoverTeamspacesDto } from 'src/modules/teamspace/application/dto/teamspace/discover-teamspaces.dto';
import { JoinTeamspaceByLinkDto } from 'src/modules/teamspace/application/dto/teamspace/join-teamspace-by-link.dto';
import { UpdateTeamspaceMemberRoleDto } from 'src/modules/teamspace/application/dto/teamspace/update-teamspace-member-role.dto';
import { TeamspaceMemberResponseDto } from 'src/modules/teamspace/application/dto/teamspace/response/teamspace-member.response.dto';
import { MyTeamspaceInvitationResponseDto, TeamspaceInvitationResponseDto } from 'src/modules/teamspace/application/dto/teamspace/response/teamspace-invitation.response.dto';
import { CreatedTeamspaceInviteLinkResponseDto, TeamspaceInviteLinkResponseDto } from 'src/modules/teamspace/application/dto/teamspace/response/teamspace-invite-link.response.dto';
import { DiscoverTeamspacesResponseDto } from 'src/modules/teamspace/application/dto/teamspace/response/discover-teamspaces.response.dto';
import { TeamspaceResponseDto } from 'src/modules/teamspace/application/dto/teamspace/response/teamspace.response.dto';
import { UpdateTeamspaceJoinSettingsDto } from 'src/modules/teamspace/application/dto/teamspace/update-teamspace-join-settings.dto';
import { InviteTeamspaceMemberDto } from 'src/modules/teamspace/application/dto/teamspace/invite-teamspace-member.dto';
import { ListTeamspaceInvitationsDto } from 'src/modules/teamspace/application/dto/teamspace/list-teamspace-invitations.dto';
import { ListTeamspaceInvitationsResponseDto } from 'src/modules/teamspace/application/dto/teamspace/response/teamspace-invitation-management.response.dto';
import { GetMyTeamspaceInvitationsHandler } from 'src/modules/teamspace/application/queries/teamspace/get-my-teamspace-invitations/get-my-teamspace-invitations.handler';
import { GetMyTeamspaceInvitationsQuery } from 'src/modules/teamspace/application/queries/teamspace/get-my-teamspace-invitations/get-my-teamspace-invitations.query';
import { DiscoverTeamspacesHandler } from 'src/modules/teamspace/application/queries/teamspace/discover-teamspaces/discover-teamspaces.handler';
import { DiscoverTeamspacesQuery } from 'src/modules/teamspace/application/queries/teamspace/discover-teamspaces/discover-teamspaces.query';
import { ListTeamspaceInviteLinksHandler } from 'src/modules/teamspace/application/queries/teamspace/list-teamspace-invite-links/list-teamspace-invite-links.handler';
import { ListTeamspaceInviteLinksQuery } from 'src/modules/teamspace/application/queries/teamspace/list-teamspace-invite-links/list-teamspace-invite-links.query';
import { ListTeamspaceInvitationsHandler } from 'src/modules/teamspace/application/queries/teamspace/list-teamspace-invitations/list-teamspace-invitations.handler';
import { ListTeamspaceInvitationsQuery } from 'src/modules/teamspace/application/queries/teamspace/list-teamspace-invitations/list-teamspace-invitations.query';
import { GetTeamspaceMembersHandler } from 'src/modules/teamspace/application/queries/teamspace/get-teamspace-members/get-teamspace-members.handler';
import { GetTeamspaceMembersQuery } from 'src/modules/teamspace/application/queries/teamspace/get-teamspace-members/get-teamspace-members.query';
import { GetTeamspacesHandler } from 'src/modules/teamspace/application/queries/teamspace/get-teamspaces/get-teamspaces.handler';
import { GetTeamspacesQuery } from 'src/modules/teamspace/application/queries/teamspace/get-teamspaces/get-teamspaces.query';
import { TEAMSPACE_TYPES } from 'src/modules/teamspace/teamspace.types';
import { type IAuth } from 'src/types/auth';

@Controller('teamspaces')
export class TeamspaceController {
  constructor(
    @Inject(TEAMSPACE_TYPES.applications.CreateTeamspaceHandler)
    private readonly createTeamspaceHandler: CreateTeamspaceHandler,
    @Inject(TEAMSPACE_TYPES.applications.GetTeamspacesHandler)
    private readonly getTeamspacesHandler: GetTeamspacesHandler,
    @Inject(TEAMSPACE_TYPES.applications.AddTeamspaceMemberHandler)
    private readonly addTeamspaceMemberHandler: AddTeamspaceMemberHandler,
    @Inject(TEAMSPACE_TYPES.applications.GetTeamspaceMembersHandler)
    private readonly getTeamspaceMembersHandler: GetTeamspaceMembersHandler,
    @Inject(TEAMSPACE_TYPES.applications.UpdateTeamspaceMemberRoleHandler)
    private readonly updateTeamspaceMemberRoleHandler: UpdateTeamspaceMemberRoleHandler,
    @Inject(TEAMSPACE_TYPES.applications.RemoveTeamspaceMemberHandler)
    private readonly removeTeamspaceMemberHandler: RemoveTeamspaceMemberHandler,
    @Inject(TEAMSPACE_TYPES.applications.LeaveTeamspaceHandler)
    private readonly leaveTeamspaceHandler: LeaveTeamspaceHandler,
    @Inject(TEAMSPACE_TYPES.applications.InviteTeamspaceMemberHandler)
    private readonly inviteTeamspaceMemberHandler: InviteTeamspaceMemberHandler,
    @Inject(TEAMSPACE_TYPES.applications.AcceptTeamspaceInvitationHandler)
    private readonly acceptTeamspaceInvitationHandler: AcceptTeamspaceInvitationHandler,
    @Inject(TEAMSPACE_TYPES.applications.DeclineTeamspaceInvitationHandler)
    private readonly declineTeamspaceInvitationHandler: DeclineTeamspaceInvitationHandler,
    @Inject(TEAMSPACE_TYPES.applications.GetMyTeamspaceInvitationsHandler)
    private readonly getMyTeamspaceInvitationsHandler: GetMyTeamspaceInvitationsHandler,
    @Inject(TEAMSPACE_TYPES.applications.ListTeamspaceInvitationsHandler)
    private readonly listTeamspaceInvitationsHandler: ListTeamspaceInvitationsHandler,
    @Inject(TEAMSPACE_TYPES.applications.RevokeTeamspaceInvitationHandler)
    private readonly revokeTeamspaceInvitationHandler: RevokeTeamspaceInvitationHandler,
    @Inject(TEAMSPACE_TYPES.applications.ResendTeamspaceInvitationHandler)
    private readonly resendTeamspaceInvitationHandler: ResendTeamspaceInvitationHandler,
    @Inject(TEAMSPACE_TYPES.applications.CreateTeamspaceInviteLinkHandler)
    private readonly createTeamspaceInviteLinkHandler: CreateTeamspaceInviteLinkHandler,
    @Inject(TEAMSPACE_TYPES.applications.JoinTeamspaceByLinkHandler)
    private readonly joinTeamspaceByLinkHandler: JoinTeamspaceByLinkHandler,
    @Inject(TEAMSPACE_TYPES.applications.RevokeTeamspaceInviteLinkHandler)
    private readonly revokeTeamspaceInviteLinkHandler: RevokeTeamspaceInviteLinkHandler,
    @Inject(TEAMSPACE_TYPES.applications.ListTeamspaceInviteLinksHandler)
    private readonly listTeamspaceInviteLinksHandler: ListTeamspaceInviteLinksHandler,
    @Inject(TEAMSPACE_TYPES.applications.JoinTeamspaceHandler)
    private readonly joinTeamspaceHandler: JoinTeamspaceHandler,
    @Inject(TEAMSPACE_TYPES.applications.DiscoverTeamspacesHandler)
    private readonly discoverTeamspacesHandler: DiscoverTeamspacesHandler,
    @Inject(TEAMSPACE_TYPES.applications.UpdateTeamspaceJoinSettingsHandler)
    private readonly updateTeamspaceJoinSettingsHandler: UpdateTeamspaceJoinSettingsHandler,
  ) {}

  @Post()
  create(@Body() dto: CreateTeamspaceDto, @Auth() auth: IAuth) {
    return this.createTeamspaceHandler.execute(
      new CreateTeamspaceCommand(
        auth.id,
        dto.workspaceId,
        dto.name,
        dto.description ?? null,
        dto.icon ?? null,
        dto.visibility,
      ),
    );
  }

  @Get()
  findAll(@Query('workspaceId', ParseUUIDPipe) workspaceId: string, @Auth() auth: IAuth) {
    return this.getTeamspacesHandler.execute(
      new GetTeamspacesQuery(auth.id, workspaceId),
    );
  }

  @Post(':teamspaceId/members')
  async addMember(
    @Param('teamspaceId', ParseUUIDPipe) teamspaceId: string,
    @Body() dto: AddTeamspaceMemberDto,
    @Auth() auth: IAuth,
  ) {
    return this.addTeamspaceMemberHandler.execute(
      new AddTeamspaceMemberCommand(
        teamspaceId,
        dto.workspace_member_id,
        dto.role_name,
        auth.id,
      ),
    );
  }

  @Get(':teamspaceId/members')
  findMembers(@Param('teamspaceId', ParseUUIDPipe) teamspaceId: string, @Auth() auth: IAuth) {
    return this.getTeamspaceMembersHandler.execute(
      new GetTeamspaceMembersQuery(teamspaceId, auth.id),
    );
  }

  @Patch(':teamspaceId/members/:memberId/role')
  async updateMemberRole(
    @Param('teamspaceId', ParseUUIDPipe) teamspaceId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateTeamspaceMemberRoleDto,
    @Auth() auth: IAuth,
  ): Promise<TeamspaceMemberResponseDto> {
    const member = await this.updateTeamspaceMemberRoleHandler.execute(
      new UpdateTeamspaceMemberRoleCommand(
        teamspaceId,
        memberId,
        dto.role_name,
        auth.id,
      ),
    );
    return TeamspaceMemberResponseDto.fromDomain(member);
  }

  @Delete(':teamspaceId/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('teamspaceId', ParseUUIDPipe) teamspaceId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Auth() auth: IAuth,
  ): Promise<void> {
    await this.removeTeamspaceMemberHandler.execute(
      new RemoveTeamspaceMemberCommand(teamspaceId, memberId, auth.id),
    );
  }

  @Post(':teamspaceId/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leaveTeamspace(
    @Param('teamspaceId', ParseUUIDPipe) teamspaceId: string,
    @Auth() auth: IAuth,
  ): Promise<void> {
    await this.leaveTeamspaceHandler.execute(
      new LeaveTeamspaceCommand(teamspaceId, auth.id),
    );
  }

  @Post(':teamspaceId/invitations')
  @InviteRateLimit()
  async inviteMember(
    @Param('teamspaceId', ParseUUIDPipe) teamspaceId: string,
    @Body() dto: InviteTeamspaceMemberDto,
    @Auth() auth: IAuth,
  ): Promise<TeamspaceInvitationResponseDto> {
    return this.inviteTeamspaceMemberHandler.execute(
      new InviteTeamspaceMemberCommand(teamspaceId, dto.workspace_member_id, auth.id),
    );
  }

  @Get(':teamspaceId/invitations')
  async listInvitations(
    @Param('teamspaceId', ParseUUIDPipe) teamspaceId: string,
    @Query() query: ListTeamspaceInvitationsDto,
    @Auth() auth: IAuth,
  ): Promise<ListTeamspaceInvitationsResponseDto> {
    return this.listTeamspaceInvitationsHandler.execute(
      new ListTeamspaceInvitationsQuery(teamspaceId, auth.id, query.page ?? 1, query.limit ?? 20, query.status),
    );
  }

  @Get('invitations/me')
  async getMyInvitations(@Auth() auth: IAuth): Promise<MyTeamspaceInvitationResponseDto[]> {
    return this.getMyTeamspaceInvitationsHandler.execute(
      new GetMyTeamspaceInvitationsQuery(auth.id),
    );
  }

  @Post('invitations/:invitationId/accept')
  async acceptInvitation(
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
    @Auth() auth: IAuth,
  ): Promise<TeamspaceInvitationResponseDto> {
    return this.acceptTeamspaceInvitationHandler.execute(
      new AcceptTeamspaceInvitationCommand(invitationId, auth.id),
    );
  }

  @Post('invitations/:invitationId/decline')
  async declineInvitation(
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
    @Auth() auth: IAuth,
  ): Promise<TeamspaceInvitationResponseDto> {
    return this.declineTeamspaceInvitationHandler.execute(
      new DeclineTeamspaceInvitationCommand(invitationId, auth.id),
    );
  }

  @Post('invitations/:invitationId/revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeInvitation(
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
    @Auth() auth: IAuth,
  ): Promise<void> {
    await this.revokeTeamspaceInvitationHandler.execute(
      new RevokeTeamspaceInvitationCommand(invitationId, auth.id),
    );
  }

  @Post('invitations/:invitationId/resend')
  @HttpCode(HttpStatus.OK)
  @InviteRateLimit()
  async resendInvitation(
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
    @Auth() auth: IAuth,
  ): Promise<TeamspaceInvitationResponseDto> {
    return this.resendTeamspaceInvitationHandler.execute(
      new ResendTeamspaceInvitationCommand(invitationId, auth.id),
    );
  }

  @Post(':teamspaceId/invite-links')
  @InviteRateLimit()
  async createInviteLink(
    @Param('teamspaceId', ParseUUIDPipe) teamspaceId: string,
    @Body() dto: CreateTeamspaceInviteLinkDto,
    @Auth() auth: IAuth,
  ): Promise<CreatedTeamspaceInviteLinkResponseDto> {
    return this.createTeamspaceInviteLinkHandler.execute(
      new CreateTeamspaceInviteLinkCommand(teamspaceId, auth.id, dto.expires_at, dto.max_uses),
    );
  }

  @Get(':teamspaceId/invite-links')
  async listInviteLinks(
    @Param('teamspaceId', ParseUUIDPipe) teamspaceId: string,
    @Auth() auth: IAuth,
  ): Promise<TeamspaceInviteLinkResponseDto[]> {
    return this.listTeamspaceInviteLinksHandler.execute(
      new ListTeamspaceInviteLinksQuery(teamspaceId, auth.id),
    );
  }

  @Post('join-by-link')
  @InviteRateLimit()
  async joinByLink(
    @Body() dto: JoinTeamspaceByLinkDto,
    @Auth() auth: IAuth,
  ): Promise<TeamspaceMemberResponseDto> {
    const member = await this.joinTeamspaceByLinkHandler.execute(
      new JoinTeamspaceByLinkCommand(dto.token, auth.id),
    );
    return TeamspaceMemberResponseDto.fromDomain(member);
  }

  @Delete(':teamspaceId/invite-links/:linkId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeInviteLink(
    @Param('teamspaceId', ParseUUIDPipe) teamspaceId: string,
    @Param('linkId', ParseUUIDPipe) linkId: string,
    @Auth() auth: IAuth,
  ): Promise<void> {
    await this.revokeTeamspaceInviteLinkHandler.execute(
      new RevokeTeamspaceInviteLinkCommand(teamspaceId, linkId, auth.id),
    );
  }

  @Get('discover')
  async discover(
    @Query() query: DiscoverTeamspacesDto,
    @Auth() auth: IAuth,
  ): Promise<DiscoverTeamspacesResponseDto> {
    return this.discoverTeamspacesHandler.execute(
      new DiscoverTeamspacesQuery(
        query.workspaceId, auth.id, query.page ?? 1, query.limit ?? 20,
      ),
    );
  }

  @Post(':teamspaceId/join')
  async join(
    @Param('teamspaceId', ParseUUIDPipe) teamspaceId: string,
    @Auth() auth: IAuth,
  ): Promise<TeamspaceMemberResponseDto> {
    const member = await this.joinTeamspaceHandler.execute(
      new JoinTeamspaceCommand(teamspaceId, auth.id),
    );
    return TeamspaceMemberResponseDto.fromDomain(member);
  }

  @Patch(':teamspaceId/join-settings')
  async updateJoinSettings(
    @Param('teamspaceId', ParseUUIDPipe) teamspaceId: string,
    @Body() dto: UpdateTeamspaceJoinSettingsDto,
    @Auth() auth: IAuth,
  ): Promise<TeamspaceResponseDto> {
    return this.updateTeamspaceJoinSettingsHandler.execute(
      new UpdateTeamspaceJoinSettingsCommand(teamspaceId, dto.visibility, auth.id),
    );
  }
}
