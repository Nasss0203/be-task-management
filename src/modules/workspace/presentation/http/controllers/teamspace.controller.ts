import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { AddTeamspaceMemberCommand } from 'src/modules/workspace/application/commands/teamspace/add-teamspace-member/add-teamspace-member.command';
import { AddTeamspaceMemberHandler } from 'src/modules/workspace/application/commands/teamspace/add-teamspace-member/add-teamspace-member.handler';

import { CreateTeamspaceCommand } from 'src/modules/workspace/application/commands/teamspace/create-teamspace/create-teamspace.command';
import { CreateTeamspaceHandler } from 'src/modules/workspace/application/commands/teamspace/create-teamspace/create-teamspace.handler';
import { AddTeamspaceMemberDto } from 'src/modules/workspace/application/dto/teamspace/add-teamspace-member.dto';
import { CreateTeamspaceDto } from 'src/modules/workspace/application/dto/teamspace/create-teamspace.dto';
import { GetTeamspaceMembersHandler } from 'src/modules/workspace/application/queries/teamspace/get-teamspace-members/get-teamspace-members.handler';
import { GetTeamspaceMembersQuery } from 'src/modules/workspace/application/queries/teamspace/get-teamspace-members/get-teamspace-members.query';
import { GetTeamspacesHandler } from 'src/modules/workspace/application/queries/teamspace/get-teamspaces/get-teamspaces.handler';
import { GetTeamspacesQuery } from 'src/modules/workspace/application/queries/teamspace/get-teamspaces/get-teamspaces.query';
import { type IAuth } from 'src/types/auth';

@Controller('teamspaces')
export class TeamspaceController {
  constructor(
    private readonly createTeamspaceHandler: CreateTeamspaceHandler,
    private readonly getTeamspacesHandler: GetTeamspacesHandler,
    private readonly addTeamspaceMemberHandler: AddTeamspaceMemberHandler,
    private readonly getTeamspaceMembersHandler: GetTeamspaceMembersHandler,
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
  findAll(@Query('workspaceId') workspaceId: string, @Auth() auth: IAuth) {
    return this.getTeamspacesHandler.execute(
      new GetTeamspacesQuery(auth.id, workspaceId),
    );
  }

  @Post(':teamspaceId/members')
  async addMember(
    @Param('teamspaceId') teamspaceId: string,
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
  findMembers(@Param('teamspaceId') teamspaceId: string, @Auth() auth: IAuth) {
    return this.getTeamspaceMembersHandler.execute(
      new GetTeamspaceMembersQuery(teamspaceId, auth.id),
    );
  }
}
