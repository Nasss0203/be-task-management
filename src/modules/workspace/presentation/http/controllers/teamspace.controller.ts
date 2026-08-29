import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';

import { CreateTeamspaceCommand } from 'src/modules/workspace/application/commands/teamspace/create-teamspace/create-teamspace.command';
import { CreateTeamspaceHandler } from 'src/modules/workspace/application/commands/teamspace/create-teamspace/create-teamspace.handler';
import { CreateTeamspaceDto } from 'src/modules/workspace/application/dto/teamspace/create-teamspace.dto';
import { GetTeamspacesHandler } from 'src/modules/workspace/application/queries/teamspace/get-teamspaces/get-teamspaces.handler';
import { GetTeamspacesQuery } from 'src/modules/workspace/application/queries/teamspace/get-teamspaces/get-teamspaces.query';
import { type IAuth } from 'src/types/auth';

@Controller('teamspaces')
export class TeamspaceController {
  constructor(
    private readonly createTeamspaceHandler: CreateTeamspaceHandler,
    private readonly getTeamspacesHandler: GetTeamspacesHandler,
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
}
